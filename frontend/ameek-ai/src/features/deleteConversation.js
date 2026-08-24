import api from "../../utils/axios"

export const deleteConversation = async (conversationId) => {

    try {
        await api.delete(`/api/chat/delete-conversation/${conversationId}`)
        return true
    } catch (error) {
        console.log("deleteConversation error:", error?.response?.data || error?.message)
        return false
    }
}
