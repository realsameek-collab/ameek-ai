// MUST be first: ESM evaluates every import before this module's body runs.
// This covers the normal case (process started from the service directory).
// The explicit-path dotenv.config() below stays as a fallback for when the
// working directory is not this folder.
import "dotenv/config";

import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import connectDB from "./config/db.js";
import router from "./routes/auth.route.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });
console.log(`Loaded .env from ${path.join(__dirname, ".env")}`);
const { default: redis } = await import("../../shared/redis/redis.js");
const port = process.env.PORT || 8000;

const app = express();
app.use(express.json());
app.use("/", router);
app.get("/", (req, res) => {
  res.json({ message: "Hello from the auth server!" });
});

connectDB();

app.listen(port, () => {
  console.log(`Services /auth Server is running on port ${port}`);
});