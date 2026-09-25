import proxy from "express-http-proxy"

// an unreachable upstream otherwise falls through to express's default
// html "Internal Server Error", which hides which service and why
export const proxyErrorHandler = (name, serviceUrl) => (err, res) => {
    console.error(`proxy to ${name} (${serviceUrl}) failed:`, err.code ?? "", err.message)
    return res.status(502).json({
        message: `gateway could not reach the ${name} service`,
        error: err.code ?? err.message
    })
}

export const proxyWithHeader=(serviceUrl, name = "upstream")=>{


         return proxy(serviceUrl, {
            // express-http-proxy defaults to a 1mb body and answers 413 above
            // it. that silently blocked photo uploads while small pdfs passed.
            // headroom over multer's own 20mb cap, so the real limit and its
            // error message both come from multer.
            limit: "25mb",
            proxyErrorHandler: proxyErrorHandler(name, serviceUrl),
            proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
                if (srcReq.user) {
                    proxyReqOpts.headers["x-user-id"] = srcReq.user.userId
                }
                return proxyReqOpts
            }
         })

}