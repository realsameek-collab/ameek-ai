import express from "express"
import { createConversation, deleteConversation, getConversations, getMessages, saveMessage, updateConversation } from "../controllers/chat.controller.js"

const router = express.Router()

router.get("/create-conversation",createConversation)
router.get("/get-conversation",getConversations)
router.get("/get-conversations",getConversations)
router.post("/update-conversation",updateConversation)
router.post("/save-message",saveMessage)
router.post("/get-message/:conversationId",getMessages)
router.delete("/delete-conversation/:conversationId",deleteConversation)

export default router