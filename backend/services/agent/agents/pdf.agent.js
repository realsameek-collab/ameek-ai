import axios from "axios";
import { getModel } from "../config/llmModel.js";
import { toText } from "../utils/toText.js";
import { generatePdf } from "../utils/generatePdf.js";
import { GetFromS3 } from "../utils/getFromS3.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { checkAgentLimit } from "./agentLimit.js";

// appended to every cover prompt. pollinations has no negative-prompt
// parameter, so the exclusions have to live in the prompt string itself.
const COVER_STYLE = ", editorial technical illustration, clean minimal composition, " +
       "muted colour palette, subject focused, professional, " +
       "no text, no words, no letters, no numbers, no watermark, " +
       "no cartoon, no mascot, no character, no anime, no storybook style"

// turns the document topic into a literal, on-subject image prompt. this is the
// same technique the vision agent uses, and it is why its images stay relevant.
const buildCoverPrompt = async (topic, title, hint) => {
       try { 
              await checkAgentLimit(state.userId,"pdf")
              const llm = await getModel("vision")
              const res = await llm.invoke(`
You write image prompts for the cover of a serious document.

The cover must depict the ACTUAL SUBJECT MATTER of the document: the real
objects, structures, instruments, diagrams or phenomena the topic is about.

Rules:
- Be literal and concrete. Name the things that should appear.
- For abstract or mathematical topics, depict the physical objects, tools or
  geometry associated with them, never a person or a mascot.
- Never include text, letters, numbers, logos or captions in the image.
- Never a cartoon, character, anime or storybook illustration.
- One sentence. Return only the prompt.

Document title: ${title ?? ""}
Author's cover idea (may be weak, improve or replace it): ${hint ?? "none"}

Topic:
${topic}
`)
              const refined = toText(res).trim().split("\n")[0].replace(/^["']|["']$/g, "").trim()
              return refined || null
       } catch (error) {
              console.log("pdfAgent: cover prompt refinement skipped -", error.message)
              return null
       }
}

// a single cover image, fetched the same way the vision agent does
const fetchCover = async (coverPrompt) => {
       if (!coverPrompt) return null
       try {
              const params = new URLSearchParams({
                     width: "1024",
                     height: "1024",
                     model: "flux",
                     seed: String(Math.floor(Math.random() * 1_000_000)),
                     nologo: "true",
              })
              const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(coverPrompt + COVER_STYLE)}?${params}`
              console.log("pdfAgent: cover prompt =", coverPrompt.slice(0, 90))
              const res = await axios.get(url, { responseType: "arraybuffer", timeout: 60000 })
              return Buffer.from(res.data)
       } catch (error) {
              // a missing cover must never fail the document
              console.log("pdfAgent: cover image skipped -", error.message)
              return null
       }
}

export const pdfAgent = async(state)=>{

       try{
          const llm = await getModel("pdf")
          const prompt =`
          You are an expert Document writer

Return Only Valid JSON

Don Not Return Markdown

Do Not Return  Explanation

Structure

{
  "title": "",
  "subtitle": "",
  "author": "",
  "coverImagePrompt": "",
  "sections": [
    {
      "heading": "",
      "paragraphs": [],
      "points": []
    }
  ]
}

Write it like a short academic paper.

title: the document title.
subtitle: one line describing the context or purpose.
author: "AmeekAI" unless the topic implies another author.

coverImagePrompt: one sentence describing a cover image that depicts the
ACTUAL SUBJECT MATTER of this document - the real objects, structures,
instruments, diagrams or phenomena involved. Be literal and concrete.
For abstract or mathematical topics, describe the physical objects, tools or
geometry associated with them. Never a person, mascot, character or cartoon.
Never include text, letters or numbers in the image.

Generate 4-8 sections.

Each section has 2-4 "paragraphs" of flowing prose, 3-6 sentences each.
Write real explanatory prose, not bullet fragments.

Use "points" only when a genuine list is the clearest form, otherwise leave it empty.

Topic:

${state.prompt}
 `
 const res = await llm.invoke(prompt)

 // models wrap json in \`\`\`json fences despite being told not to, and content
 // can be a block array rather than a string
 const raw = toText(res).trim().replace(/^\`\`\`(?:json)?\s*/i, "").replace(/\`\`\`$/, "").trim()
 const data = JSON.parse(raw)

 // the json field is a hint only - a dedicated pass makes the cover on-topic,
 // and the title is the fallback if that pass fails
 const refined = await buildCoverPrompt(state.prompt, data?.title, data?.coverImagePrompt)
 const coverPrompt = refined
        || (typeof data?.coverImagePrompt === "string" && data.coverImagePrompt.trim().length > 25
              ? data.coverImagePrompt.trim()
              : [data?.title, data?.subtitle].filter(Boolean).join(", "))

 const coverImage = await fetchCover(coverPrompt)
 const pdfBuffer = await generatePdf(data, coverImage)

 const filename=`pdf-${Date.now()}.pdf`
 await uploadToS3(filename,pdfBuffer, "application/pdf")

 const downloadUrl = await GetFromS3(filename,3600) // 1 hour

return{
    ...state,
  aiResponse: `
📄 **${data.title}** is ready!

[📥 Download PDF](${downloadUrl})

⏳ *Link expires in 1 hour.*
`
}



       }
       catch(error){
       // a rate-limit rejection must reach the controller, not be replaced
       // by this agent's generic fallback message
       if (error?.status === 429) throw error

            console.log(error)
            return{
                ...state,
                aiResponse:`Failed to generate PDF`
            }

       }
}
