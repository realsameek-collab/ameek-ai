import fs from "fs"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { vectorStore } from "../config/vectorDb.js";
import { getModel } from "../config/llmModel.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { checkAgentLimit } from "./agentLimit.js";
export const pdfRag = async (state)=>{
       try {
        await checkAgentLimit(state.userId,"pdf")
        // loaded on demand: pdf-parse pulls in pdfjs, which needs native
        // canvas bindings. at module scope a failure there took the whole
        // graph down with it, so every agent stopped responding.
        const { PDFParse } = await import("pdf-parse")

        const buffer = fs.readFileSync(state.file.path)
        const pdf = new PDFParse({
            data:buffer
        })
        // getText is async - without await, result is a Promise and
        // result.text is undefined, so the splitter received nothing
        const result = await pdf.getText()
        const text = result?.text

        // fail loudly rather than embedding an empty document set
        if (!text || !text.trim()) {
            throw new Error("no extractable text found in the pdf (it may be a scanned image)")
        }
        const spilliter = new RecursiveCharacterTextSplitter({
            chunkSize:1000,
            chunkOverlap:200
        })
        const docs =await spilliter.createDocuments([text])
        const collectionName = `pdf-${Date.now()}`
        const store = await vectorStore(docs,collectionName)
        const relevantDocs = await store.similaritySearch(state.prompt,5)
        const context = relevantDocs.map(d=>d.pageContent).join("\n\n")
        const llm = await getModel("pdf-rag")
        

        const messages = [
            new SystemMessage(`
                You are an AmeekAI pdf Assistant 
    - RULES:
    -Answer only from uploded pdf

    -Never make up information

    -if Answer is not in pdf simple reply:
    "I coundn't find this information in the uploded pdf"
    - Use markdown formating
                
                
                
                
                `),
           new HumanMessage(`
            Context:${context}
           Question:${state.prompt}
            
            `)
        ]
        // missing await here meant aiResponse was a Promise, which the
        // controller read as an empty response and returned 502
        const response = await llm.invoke(messages)
          return{
            ...state,
            aiResponse:response.content
          }
       } catch (error) {
       // a rate-limit rejection must reach the controller, not be replaced
       // by this agent's generic fallback message
       if (error?.status === 429) throw error

        console.log(error)
        return{
            ...state,
            aiResponse:"Failed To Analyzed PDF"
          }
       }finally{
            // a throw in finally replaces the return value, so cleanup failures
            // are logged rather than allowed to destroy a successful answer
            try {
                 if (state.file?.path) await fs.promises.unlink(state.file.path)
            } catch (cleanupError) {
                 console.warn("pdfRag: temp file cleanup failed -", cleanupError.message)
            }
       }
}