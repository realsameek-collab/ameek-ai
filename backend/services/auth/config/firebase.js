import { cert, getApps, initializeApp } from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Production/hosting: credentials come from an env var (no filesystem access
// to a checked-out repo). Local dev: falls back to the gitignored key file.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT.replace(/\\n/g, "\n"))
  : JSON.parse(readFileSync(path.join(__dirname, "..", "serviceAccountKey.json"), "utf8"));

export const app = getApps().length === 0 
  ? initializeApp({ credential: cert(serviceAccount) }) 
  : getApps()[0];
