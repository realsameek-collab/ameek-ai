import { cert, getApps, initializeApp } from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Production/hosting: credentials come from an env var (no filesystem access
// to a checked-out repo). Local dev: falls back to the gitignored key file.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : JSON.parse(readFileSync(path.join(__dirname, "..", "serviceAccountKey.json"), "utf8"));

// unescape only the key, and only after parsing: turning \n into real newlines
// across the whole JSON string first puts control characters inside
// private_key and JSON.parse throws, crashing the service on startup.
// this still covers a key that was pasted double-escaped.
serviceAccount.private_key = serviceAccount.private_key?.replace(/\\n/g, "\n");

export const app = getApps().length === 0 
  ? initializeApp({ credential: cert(serviceAccount) }) 
  : getApps()[0];
