import proxy from "express-http-proxy"

export const proxyWithHeader=(serviceUrl)=>{


         return proxy(serviceUrl, {
            // express-http-proxy defaults to a 1mb body and answers 413 above
            // it. that silently blocked photo uploads while small pdfs passed.
            // headroom over multer's own 20mb cap, so the real limit and its
            // error message both come from multer.
            limit: "25mb",
            proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
                if (srcReq.user) {
                    proxyReqOpts.headers["x-user-id"] = srcReq.user.userId
                }
                return proxyReqOpts
            }
         })

}