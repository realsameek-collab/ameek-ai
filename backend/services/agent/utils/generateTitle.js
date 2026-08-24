import { getModel } from "../config/llmModel.js"
import { toText } from "./toText.js"

const SYSTEM_PROMPT = `You name chat conversations.

Given the user's first message, reply with the title only - no preamble, no explanation.

Rules:
- 2 to 5 words
- sentence case: capitalise the first word only, unless a word is a proper noun
- natural, spoken English - how a person would describe the chat to a friend
- capture what the person actually wants, not the words they happened to use
- no quotes, no trailing period, no "Title:" label
- never formal or corporate - not "Inquiry regarding faucet repair", not "Assistance with debugging"
- never just the opening words of the message copied back

Examples:
How do I fix a leaking faucet in the kitchen? -> Fixing a kitchen leak
Can you help me debug this python stack trace error? -> Debug a stack trace
What are some good recipes for dinner using chicken? -> Chicken dinner ideas
explain redis to me like im five -> Redis explained simply
write me a netflix clone in react -> Building a Netflix clone`

// models like to answer with 'Title: "Fixing a kitchen leak."' - strip all of that
const clean = (raw) => {
    let title = toText(raw).trim().split("\n")[0]

    title = title
        .replace(/^(chat\s+)?title\s*[:\-]\s*/i, "")
        .replace(/^["'`*]+|["'`*]+$/g, "")
        .replace(/[.!]+$/, "")
        .trim()

    title = title.split(/\s+/).filter(Boolean).slice(0, 6).join(" ")

    if (!title) return null
    return title.charAt(0).toUpperCase() + title.slice(1)
}

export const generateTitle = async (prompt) => {
    try {
        const llm = await getModel("title")
        const response = await llm.invoke([
            { role: "system", content: SYSTEM_PROMPT },
            { role: "human", content: prompt }
        ])

        const title = clean(response)
        console.log("generated title:", title)
        return title
    } catch (error) {
        // a missing title must never surface as an error to the user
        console.log("generateTitle failed:", error.message)
        return null
    }
}

export default generateTitle
