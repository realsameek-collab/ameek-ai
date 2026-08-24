import { getModel } from "../config/llmModel.js"
import { toText } from "../utils/toText.js"
export const router = async(state)=>{


      // 1 + 2. an upload decides the route on its own. only imageAnalyzer and
      // pdfRag can read a file, so this has to come before both the picked-mode
      // shortcut and the llm - either would silently discard the attachment.
      if (state.file) {
            const mimetype = state.file.mimetype ?? ""

            if (mimetype.startsWith("image/")) {
                  return{
                        ...state,
                  agent:"imageAnalyzer"
                  }
            }

            if (mimetype === "application/pdf") {
                  return{
                        ...state,
                  agent:"pdfRag"
                  }
            }

            // multer's fileFilter only admits images and pdfs, so this means
            // the file arrived in a shape the router did not expect
            console.warn("ROUTER: file present but mimetype unusable:", JSON.stringify(mimetype))
      }

      // 3. no usable file - normal text routing decides
      if (state.agent && state.agent !== "auto") {
         return{
            ...state,
            agent: state.agent
         }

      }

      const llm= await getModel('router')
      const prompt = `you are an agent router.
Available agents:
-chat
-search
-coding
-pdf
-ppt
-vision

Rules:

chat:
General Conversation,
explaination,
learning,
questions

search:
current events,
latest information,
news,
recent developments,
internet lookup,

coding:
generate code,
debug code,
build projects,
architecture,
API design

pdf:
Question about generate pdfs
or document context

ppt:
Questions about generate ppts
or ppt context 


vision:
Generate image 
Creat image 


Return only one word:

chat 
search 
coding
pdf
ppt
vision

User Query:
    ${state.prompt}

`
const response = await llm.invoke(prompt)
const decision = toText(response).trim().toLowerCase()
console.log("router decision raw:", decision)

const allowed = ["chat","search","coding","pdf","ppt","vision"]
const agent = allowed.find((a)=> decision === a) || allowed.find((a)=> decision.includes(a)) || "chat"

return{

      ...state,
      agent
}
}