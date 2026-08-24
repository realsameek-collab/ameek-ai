import axios from "axios";
import { getModel } from "../config/llmModel.js";
import { GetFromS3 } from "../utils/getFromS3.js";
import { toText } from "../utils/toText.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { checkAgentLimit } from "./agentLimit.js";

export const visionAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId,"image")
        const llm = await getModel("vision")
        const res = await llm.invoke(`
        You are an elite AI image prompt engineer.

Convert the user request into a highly detailed image generation prompt.

Requirements:

- Cinematic lighting
- Professional composition
- Ultra realistic
- High detail
- Beautiful color palette
- Sharp focus
- 8K quality
- Photorealistic
- Depth of field
- Professional photography
- Stunning visuals

Return only the image prompt.

User Request:
${state.prompt}
        `)

        const prompt = toText(res).trim()
        if (!prompt) throw new Error("empty image prompt")

        // pollinations regenerates on every request, so a fixed seed is what keeps
        // this url returning the same image we downloaded and pushed to s3
        const seed = Math.floor(Math.random() * 1_000_000)
        const params = new URLSearchParams({
            width: "1024",
            height: "1024",
            model: "flux",
            seed: String(seed),
            nologo: "true",
        })
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`
        console.log("visionAgent: image prompt =", prompt.slice(0, 80))
        const imageRes = await axios.get(imageUrl, { responseType: "arraybuffer" })
        const buffer = Buffer.from(imageRes.data)
        const filename = `image-${Date.now()}.png`
        await uploadToS3(filename, buffer, "image/png")
        const downloadUrl = await GetFromS3(filename, 3600) // 1 hour
        return {
            ...state,
            images: [imageUrl],
            aiResponse: `Here’s the image you requested! ✨

📥 [Download image](${downloadUrl}) — link expires in 1 hour.`
        }
    } catch (error) {
    // a rate-limit rejection must reach the controller, not be replaced
    // by this agent's generic fallback message
    if (error?.status === 429) throw error

        console.error("visionAgent ERROR:", error.message)
        return {
            ...state,
            aiResponse: `# ❌ Image Generation Failed
            `}

    }
}
