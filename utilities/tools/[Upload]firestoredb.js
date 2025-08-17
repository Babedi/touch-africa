/**
 * Import entire Firestore database from JSON (including subcollections)
 * ES Modules version
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

// ES Modules-friendly __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import service account JSON
import serviceAccount from "../secrets/serviceAccountKey.json" with { type: "json" };

// Init Firestore Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * Recursively writes documents and subcollections into Firestore
 */
async function importDataToCollection(collectionRef, data) {
  for (const [docId, docData] of Object.entries(data)) {
    const { __collections__, ...fields } = docData;

    await collectionRef.doc(docId).set(fields);

    if (__collections__) {
      for (const [subColName, subColData] of Object.entries(__collections__)) {
        const subCollectionRef = collectionRef
          .doc(docId)
          .collection(subColName);
        await importDataToCollection(subCollectionRef, subColData);
      }
    }
  }
}

(async () => {
  console.log("Importing Firestore database...");

  const inputPath = path.join(__dirname, "./../models/master.json");
  const rawData = fs.readFileSync(inputPath, "utf8");
  const data = JSON.parse(rawData);

  for (const [colName, colData] of Object.entries(data)) {
    const colRef = db.collection(colName);
    await importDataToCollection(colRef, colData);
  }

  console.log("✅ Import complete!");
})();
