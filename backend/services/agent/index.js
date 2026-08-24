import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import connectDb from "./config/db.js"
import router from "./routes/agent.route.js"   // express router (NOT graph/router.js)
dotenv.config()

const port = process.env.PORT

const app = express()

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}))
app.use(express.json())

app.get("/", (req, res) => {
    res.json({ message: "hello from agent" })
})
app.use("/", router)
app.use((err,req,res,next)=>{
    console.log(err)
    if(err.status){
        return res.status(err.status).json(err.data)
    }
    return res.status(500).json({message:`agent error ${error}`})
})
// multer rejections (size limit, blocked type) otherwise surface as a blank
// 500 html page, which the frontend can only show as "something went wrong"
app.use((err, req, res, next) => {
    if (!err) return next()
    console.error("REQUEST FAILED:", err.code ?? err.name ?? "", err.message)

    // rate limiter attaches its own status and payload
    if (err.status === 429) return res.status(429).json(err.data ?? { message: err.message })

    const isUpload = err.name === "MulterError"
    return res.status(isUpload ? 400 : 500).json({
        message: isUpload
            ? (err.code === "LIMIT_FILE_SIZE" ? "That file is too large (max 20MB)." : `Upload rejected: ${err.message}`)
            : err.message
    })
})

app.listen(port, () => {
    console.log(`agent started at ${port}`)
    connectDb()
})
