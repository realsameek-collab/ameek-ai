// MUST be first: ESM evaluates every import before this module's body runs,
// so config/db.js was reading process.env.MONGODB_URI before dotenv had run
import "dotenv/config"

import express from "express"
import connectDb from "./config/db.js"
import router from "./routes/chat.routes.js"

const port = process.env.PORT

const app = express()
app.use(express.json())
app.use("/",router)
app.get("/", (req, res) => {
    res.json({ message: "hello from chat" })
})

app.listen(port, () => {
    console.log(`chat started at ${port}`)
    connectDb()
})
