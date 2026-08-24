import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { getModel } from "../config/llmModel.js"
import fs from "fs"
import { checkAgentLimit } from "./agentLimit.js"

export const imageAnalyzer = async (state) => {
    await checkAgentLimit(state.userId,"imageAnalyzer")
try {
    const llm = await getModel("imageAnalyzer")
    const imageBuffer = fs.readFileSync(state.file.path)
    const base64image = imageBuffer.toString("base64")

    const messages=[
             new SystemMessage(
                 `You are AmeekAI imageAnalyzer Agent.

Rules:

- Analyze only the uploaded image.
- Answer the user's question accurately.
- If text exists in the image, extract it.
- If charts or tables exist, explain them.
- If something is unclear, say so.
- Use Markdown when helpful.
- Do not hallucinate.`
             ),
             new HumanMessage(
                {
                    content:[
                        {
                            type:"text",
                            text:state.prompt || "analyze the image"
                        },
                        {
                            type:"image_url",
                            "image_url":{
                                url:`data:${state.file.mimetype};base64,${base64image}`
                            }
                        }
                    ]
                }
             )
    ]

const response = await llm.invoke(messages)
return{
    ...state,
    aiResponse:response.content
}
} catch (error) {
// a rate-limit rejection must reach the controller, not be replaced
// by this agent's generic fallback message
if (error?.status === 429) throw error

    // the raw object buried the cause - surface the message on one line
    console.error("imageAnalyzer FAILED:", error?.message ?? error)
    if (error?.status || error?.response?.status) {
        console.error("  http status:", error.status ?? error.response.status)
    }
    console.error("  GOOGLE_API_KEY present:", Boolean(process.env.GOOGLE_API_KEY))
    return{
    ...state,
    aiResponse: "Unable to analyze the image."
}
    
}
finally{
    // fs.unlink is callback based - calling it without one threw
    // ERR_INVALID_ARG_TYPE, and a throw inside finally replaces the return
    // value, so it discarded successful analyses. cleanup still runs, but it
    // can no longer destroy a response - it only logs.
    try {
        if (state.file?.path) await fs.promises.unlink(state.file.path)
    } catch (cleanupError) {
        console.warn("imageAnalyzer: temp file cleanup failed -", cleanupError.message)
    }
}
}