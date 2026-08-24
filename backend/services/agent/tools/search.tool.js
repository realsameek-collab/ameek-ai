import dotenv from "dotenv"
import { TavilySearch } from "@langchain/tavily"

// ESM imports are evaluated before index.js runs dotenv.config(), so the key
// has to be loaded here or TAVILY_API_KEY is undefined at construction time
dotenv.config()

export const searchTool = new TavilySearch({
    tavilyApiKey: process.env.TAVILY_API_KEY,
    maxResults: 5,
    searchDepth: "basic",
    topic: "general",
    includeImages: true,
    includeAnswer: false,
})

export default searchTool
