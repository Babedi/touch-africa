import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absolute path from project root to serviceAccountKey.json
const serviceAccountPath = path.resolve(
  __dirname,
  "../secrets/serviceAccountKey.json"
);

const serviceAccount = JSON.parse(await readFile(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const db = admin.firestore();
