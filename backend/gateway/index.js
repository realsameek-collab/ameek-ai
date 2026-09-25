// MUST be first: ESM evaluates every import before this module's body runs.
// protect -> shared/redis/redis.js reads process.env.REDIS_URL at import time,
// so the old dotenv.config() on line 7 ran far too late to matter.
import "dotenv/config";

import express from "express";
import proxy from "express-http-proxy";
import { proxyWithHeader, proxyErrorHandler } from "./utils/proxyWithHeader.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import { getCurrentUser } from "./controllers/user.controller.js";
import protect from "./middleware/auth.middleware.js"
import morgan from "morgan";

const port = process.env.PORT || 8000;
const app = express();
// comma separated, so more than one deployed frontend can be allowed. a
// browser Origin never has a trailing slash, so one pasted into FRONTEND_URL
// used to make the match fail and every response got blocked by CORS.
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);
console.log("CORS allowed origins:", allowedOrigins);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(morgan("dev"))
app.use(cookieParser());
app.use('/auth', proxy(process.env.AUTH_SERVICE, {
  proxyReqPathResolver: function (req) {
    // remove the /auth prefix before forwarding to auth service
    // so /auth/login -> /login on the auth service
    return req.originalUrl.replace(/^\/auth/, '') || '/';
  },
  userResHeaderDecorator: function (headers, userReq, userRes, proxyReq, proxyRes) {
    // ensure Set-Cookie from auth service is passed through to the browser
    try {
      if (proxyRes && proxyRes.headers && proxyRes.headers['set-cookie']) {
        headers['set-cookie'] = proxyRes.headers['set-cookie'];
      }
    } catch (e) {
      // ignore
    }
    return headers;
  },
  proxyErrorHandler: proxyErrorHandler("auth", process.env.AUTH_SERVICE)
}));
app.use("/api/chat",protect,proxyWithHeader(process.env.CHAT_SERVICE, "chat"))
app.use("/api/agent",protect,proxyWithHeader(process.env.AGENT_SERVICE, "agent"))
app.get("/api/me", protect, getCurrentUser)



app.get("/", (req, res) => {
  res.json({ message: "Hello from the gateway server!" });
});


app.listen(port, () => {
  console.log(` gateway Server is running on port ${port}`);
});