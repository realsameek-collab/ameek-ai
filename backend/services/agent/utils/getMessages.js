import axios from "axios"

export const getMessages = async (conversationId) => {

       try{
             // chat service exposes POST /get-message/:conversationId (singular)
             const {data} = await axios.post(`${process.env.CHAT_SERVICE}/get-message/${conversationId}`)
             return Array.isArray(data) ? data : []
       }
       catch(error){
        console.log("getMessages (memory) failed:", error.response?.data || error.message)
        return []

       }

}
