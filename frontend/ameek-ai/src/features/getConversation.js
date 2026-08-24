import api from "../../utils/axios"

export const getConversation=async()=>{

    try {
        const {data} = await api.get("/api/chat/get-conversation")
        return data
    } catch (error) {
        // returning the error object here fed a non-array into setConversations,
        // which silently reset the sidebar to empty with no clue why
        console.log("getConversation failed:", error?.response?.status ?? "no response",
                    error?.response?.data || error?.message)
        return []
    }
}