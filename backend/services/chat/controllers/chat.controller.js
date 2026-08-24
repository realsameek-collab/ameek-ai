import Conversation from "../models/conversation.model.js"
import Message from "../models/messeage.model.js"
export const createConversation = async (req,res)=>{

    try {
        const userId = req.headers["x-user-id"]
        console.log(userId)
        const conversation = await Conversation.create({
            userId: userId
        })
        return res.status(200).json(conversation)
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }

}

export const getConversations = async (req,res)=>{

    try {
        const userId = req.headers["x-user-id"]
        console.log(userId)
        const conversations = await Conversation.find({
            userId: userId
        }).sort({ updatedAt: -1 })
        return res.status(200).json(conversations)
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }

}

export const updateConversation = async (req,res)=>{

    try {
        const {id,title} = req.body
        const userId = req.headers["x-user-id"]
        console.log(userId)
        const conversation = await Conversation.findByIdAndUpdate(id,{
            title
        })
        return res.status(200).json(conversation)
    } catch (error) {
        return res.status(500).json({messeage : `update conversation ${error}` })
    }

}

export const saveMessage = async(req,res)=>{
    try {
        const {conversationId,role,images}=req.body

        // content must be a plain string - if an AIMessage/object slips through,
        // pull the text out of it instead of letting mongoose throw a CastError
        let {content} = req.body
        if (content && typeof content === "object") {
            content = typeof content.content === "string"
                ? content.content
                : JSON.stringify(content.content ?? content)
        }

        if (!conversationId) {
            return res.status(400).json({message:"conversationId is required"})
        }
        if (typeof content !== "string" || !content.trim()) {
            return res.status(400).json({message:"content must be a non-empty string"})
        }

        const message = await Message.create({
            conversationId,
            role,
            content,
            images,

})
console.log("saved message", message._id.toString(), role, content.slice(0,60))
return res.status(200).json(message)
    } catch (error) {
        return res.status(500).json({message:`save messages error ${error}`})
    }



}

export const getMessages = async(req,res)=>{
    try {
        const message = await Message.find({
            conversationId:req.params.conversationId
}).sort({createdAt:1})
      return res.status(200).json(message)
    } catch (error) {
        return res.status(500).json({message:`get messages error ${error}`})
    }


}
export const deleteConversation = async(req,res)=>{
    try {
        const {conversationId} = req.params
        const userId = req.headers["x-user-id"]

        // scoped by userId so a conversation can only be removed by its owner
        const conversation = await Conversation.findOneAndDelete({
            _id: conversationId,
            userId: userId
        })

        if(!conversation){
            return res.status(404).json({message:"conversation not found"})
        }

        const removed = await Message.deleteMany({conversationId})
        console.log("deleted conversation", conversationId, "and", removed.deletedCount, "messages")

        return res.status(200).json({_id:conversationId})
    } catch (error) {
        return res.status(500).json({message:`delete conversation error ${error}`})
    }
}
