import { searchTool } from "../tools/search.tool.js"
import { checkAgentLimit } from "./agentLimit.js"

export const searchAgent = async(state)=>{
      try{
         await checkAgentLimit(state.userId,"search")
         const response = await searchTool.invoke({
            query:state.prompt,

         })

      // keep only what the model needs - the raw response also carries scores,
      // timings and full page text, which would bloat the chat system prompt
      const results = (response?.results ?? []).map(({title,url,content})=>({
            title,
            url,
            content
      }))

      console.log("searchAgent:", results.length, "results for", state.prompt)

      return {
            ...state,
            searchResults:results,
            images:response?.images ?? []


      }
        }
      catch(error){
      // a rate-limit rejection must reach the controller, not be replaced
      // by this agent's generic fallback message
      if (error?.status === 429) throw error

          console.error("searchAgent ERROR:", error.message)
          return {
            ...state,
            searchResults:[],
            images:[]
          }
      }

}
