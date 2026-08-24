/*
 * One-off cleanup: removes conversations that have zero messages.
 *
 * These are left over from when "+ New Chat" persisted a conversation on click,
 * before the draft-until-first-send change. Safe to delete this file afterwards.
 *
 * Run from backend/services/chat:   node scripts/cleanupEmptyConversations.js
 * Preview without deleting:         node scripts/cleanupEmptyConversations.js --dry
 */

import mongoose from "mongoose"
import dotenv from "dotenv"
import Conversation from "../models/conversation.model.js"
import Message from "../models/messeage.model.js"

dotenv.config()

const dryRun = process.argv.includes("--dry")

const run = async () => {
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
        console.error("MONGODB_URI is not set")
        process.exit(1)
    }

    await mongoose.connect(mongoUri)
    console.log("connected" + (dryRun ? " (dry run - nothing will be deleted)" : ""))

    const conversations = await Conversation.find({}, { _id: 1, title: 1, createdAt: 1 }).lean()
    const withMessages = await Message.distinct("conversationId")
    const keep = new Set(withMessages.map((id) => String(id)))

    const empty = conversations.filter((c) => !keep.has(String(c._id)))

    console.log(`${conversations.length} conversations, ${empty.length} empty`)
    empty.forEach((c) => console.log(`  ${c._id}  ${c.title}  ${c.createdAt?.toISOString?.() ?? ""}`))

    if (!dryRun && empty.length) {
        const result = await Conversation.deleteMany({ _id: { $in: empty.map((c) => c._id) } })
        console.log(`deleted ${result.deletedCount} empty conversations`)
    }

    await mongoose.disconnect()
}

run().catch(async (error) => {
    console.error("cleanup failed:", error)
    await mongoose.disconnect()
    process.exit(1)
})
