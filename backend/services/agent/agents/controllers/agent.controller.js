import axios from "axios"
import { graph } from "../../graph/graph.js"
import { toText } from "../../utils/toText.js"
import { addMessages } from "../../config/memory.js"

const saveMessage = async (conversationId, role, content, images = []) => {
  if (!conversationId) return null
  try {
    const { data } = await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
      conversationId, role, content, images
    })
    console.log(`saved ${role} message ->`, data?._id)
    return data
  } catch (error) {
    // a failed save must not swallow the AI response
    console.error(`save-message (${role}) failed:`, error.response?.data || error.message)
    return null
  }
}

export const agent = async (req, res,next) => {
  try {
    const { prompt, conversationId ,agent} = req.body
    const file = req.file

    // the gateway sets this. the rate limiter keys on it, so without it every
    // user would share one bucket under "rate:undefined:<agent>"
    const userId = req.headers["x-user-id"]

    // metadata only, never contents - shows which agent path a turn will take
    if (file) console.log(`upload received: ${file.mimetype} (${file.size} bytes)`)

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ message: "prompt is required" })
    }
    if (!conversationId) {
      return res.status(400).json({ message: "conversationId is required" })
    }

    const result = await graph.invoke({ prompt, conversationId ,agent,file,userId})

    // extract the TEXT only - never hand the raw AIMessage to mongoose
    const aiResponse = toText(result?.aiResponse)

    if (!aiResponse.trim()) {
      return res.status(502).json({ message: "the model returned an empty response" })
    }

    // both writes happen AFTER the graph runs. chat.agent seeds its redis memory
    // from the database on a cold cache, so saving the live prompt any earlier
    // makes the model receive the same question twice
    await saveMessage(conversationId, "user", prompt)

    // named arguments do not exist in JS - `images=result.images` was an
    // assignment to an undeclared variable, which throws in strict mode
    const saved = await saveMessage(conversationId, "assistant", aiResponse, result?.images ?? [])

    await addMessages(conversationId,"user",prompt)
    await addMessages(conversationId,"assistant",aiResponse)

    return res.status(200).json({
      _id: saved?._id ?? null,
      conversationId,
      role: "assistant",
      content: aiResponse,
      agent: result?.agent ?? "chat",
      images: result?.images ?? [],
      artifacts: result?.artifacts ?? null
    })
  } catch (error) {
   next(error)
  }
}
