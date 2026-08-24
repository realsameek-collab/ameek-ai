import axios from "axios"
import { generateTitle } from "../../utils/generateTitle.js"

export const title = async (req, res) => {
  try {
    const { prompt, conversationId } = req.body

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ message: "prompt is required" })
    }
    if (!conversationId) {
      return res.status(400).json({ message: "conversationId is required" })
    }

    const generated = await generateTitle(prompt)

    // no title is not a failure - the sidebar simply keeps showing "New Chat"
    if (!generated) {
      return res.status(200).json({ _id: conversationId, title: null })
    }

    try {
      await axios.post(`${process.env.CHAT_SERVICE}/update-conversation`, {
        id: conversationId,
        title: generated
      })
    } catch (error) {
      console.error("update-conversation failed:", error.response?.data || error.message)
    }

    return res.status(200).json({ _id: conversationId, title: generated })
  } catch (error) {
    console.error("Title Error:", error)
    return res.status(500).json({ message: `Title Error: ${error.message}` })
  }
}
