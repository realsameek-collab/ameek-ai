import redis from "../../shared/redis/redis.js"

const protect = async(req,res,next)=>{

    try {
        // Prefer Authorization header (works cross-domain on mobile browsers
        // that block third-party cookies); fall back to cookie for desktop.
        let sessionId = req.cookies?.session

        const authHeader = req.headers?.authorization || req.headers?.Authorization
        if (!sessionId && authHeader && authHeader.startsWith('Bearer ')) {
            sessionId = authHeader.split(' ')[1]
        }

        if(!sessionId){

            return res.status(401).json({message:'unauthorized'})
        }
        const session = await redis.get(`session-${sessionId}`)
        if(!session){
            return res.status(401).json({message:'session expired'})

        }
        req.user = JSON.parse(session)
        next()
    } catch (error) {
        return res.status(500).json({messeage:`protect error ${error} `})
    }

    

}
export default protect