import api from "../../utils/axios"

export const createConversation=async()=>{

    try {
        const {data} = await api.get("/api/chat/create-conversation")
        return data
    } catch (error) {
        const status = error?.response?.status
        console.log("createConversation failed:", status ?? "no response", error?.response?.data || error?.message)
        // status is attached so the caller can explain what actually went wrong
        return { error: true, status }
    }
}
