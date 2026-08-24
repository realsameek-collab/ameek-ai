import redis from "../../../shared/redis/redis.js"
import { getMessages } from "../utils/getMessages.js"
export const getMemory = async (conversationId) => {

  const key = `messages-${conversationId}`

  // conversation history is an enhancement, not a requirement. a redis outage
  // used to throw here, and chatAgent re-throws, so the whole turn 500'd and
  // no agent could answer at all. degrade to no history instead.
  try {
    const cached = await redis.get(key)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (error) {
    console.error("getMemory: redis read failed, continuing without history -", error.message)
    return []
  }

  const messages = (await getMessages(conversationId)) || []

  try {
    await redis.set(key, JSON.stringify(messages),"EX", 60 * 60*24)
  } catch (error) {
    console.error("getMemory: redis write failed, history not cached -", error.message)
  }

  return messages
}

export const addMessages = async(conversationId,role,content)=>{

       // the controller awaits this before replying, so a redis failure here
       // turned a successful AI answer into a 500. cache misses are survivable.
       try {
              const key = `messages-${conversationId}`
              const rawMessages = await redis.get(key)
              const messages =rawMessages ? JSON.parse(rawMessages) : []
              messages.push({ role, content })
              if(messages.length > 20){
               messages.shift() // remove the oldest message to maintain a maximum of 20 messages
              }
              await redis.set(key, JSON.stringify(messages),"EX", 60 * 60*24)
       } catch (error) {
              console.error("addMessages: redis write failed, memory not updated -", error.message)
       }

}