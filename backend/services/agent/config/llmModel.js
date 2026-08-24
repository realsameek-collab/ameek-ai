import dotenv from "dotenv"
import { ChatGroq } from "@langchain/groq"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatOpenRouter } from "@langchain/openrouter";

dotenv.config()

const groq = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "openai/gpt-oss-120b",
    temperature: 0.7,
    maxTokens: undefined,
    maxRetries: 2,
    // other params...
})

// titles need to be repeatable - 1.5 is far too hot for a 3 word summary
const groqTitle = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "openai/gpt-oss-120b",
    temperature: 0.4,
    maxTokens: undefined,
    maxRetries: 1,
})

const gemini = new ChatGoogleGenerativeAI({
    // explicit rather than relying on the implicit env lookup
    apiKey: process.env.GOOGLE_API_KEY,
    // 2.5-flash and 2.0-flash are both retired for this key; the 404 body
    // named this as the replacement. verify against /v1beta/models before
    // changing again.
    model: "gemini-3.6-flash",
    temperature: 1.5,
    maxRetries: 2,
    // other params...
})

const openrouter = new ChatOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
      model:"deepseek/deepseek-chat",
      temperature: 0,
      maxTokens: 2500,


})







export const getModel = async (agent)=>{
       switch (agent) {
        case "chat":
          return groq
        case "search":
          return groq
        case "coding":
          return openrouter
        case "intent":
          return groq
        case "vision":
          return groq
        case "title":
          return groqTitle
        case "imageAnalyzer":
          return gemini
        default:
            return groq
       }

    }