// MUST be first: ESM evaluates every import before this module's body runs.
// protect -> shared/redis/redis.js reads process.env.REDIS_URL at import time,
// so the old dotenv.config() on line 7 ran far too late to matter.
import "dotenv/config";

import express from "express";
import proxy from "express-http-proxy";
import { proxyWithHeader } from "./utils/proxyWithHeader.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import { getCurrentUser } from "./controllers/user.controller.js";
import protect from "./middleware/auth.middleware.js"
import morgan from "morgan";

const port = process.env.PORT || 8000;
const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL,
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
  }
}));
app.use("/api/chat",protect,proxyWithHeader(process.env.CHAT_SERVICE))
app.use("/api/agent",protect,proxyWithHeader(process.env.AGENT_SERVICE))
app.use("/api/billing",protect,proxyWithHeader(process.env.BILLING_SERVICE))
app.get("/api/me", protect, getCurrentUser)



app.get("/", (req, res) => {
  res.json({ message: "Hello from the gateway server!" });
});


app.listen(port, () => {
  console.log(` gateway Server is running on port ${port}`);
});