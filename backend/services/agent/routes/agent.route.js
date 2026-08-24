import express from "express"
import { agent } from "../agents/controllers/agent.controller.js"
import { title } from "../agents/controllers/title.controller.js"
import multer from "../config/multer.js"

const router = express.Router()

router.post("/chat",multer.single("file"),agent)
router.post("/title",title)

export default router