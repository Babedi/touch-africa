/**
 * Export entire Firestore database to JSON (including subcollections)
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

async function getAllCollections(db) {
  const collections = await db.listCollections();
  const data = {};

  for (const collection of collections) {
    data[collection.id] = await getCollectionData(collection);
  }

  return data;
}

async function getCollectionData(collectionRef) {
  const docsSnap = await collectionRef.get();
  const data = {};

  for (const doc of docsSnap.docs) {
    const docData = doc.data();

    // Fetch subcollections recursively
    const subcollections = await collectionRef.doc(doc.id).listCollections();
    if (subcollections.length > 0) {
      docData.__collections__ = {};
      for (const sub of subcollections) {
        docData.__collections__[sub.id] = await getCollectionData(sub);
      }
    }

    data[doc.id] = docData;
  }

  return data;
}

(async () => {
  console.log("Exporting Firestore database...");

  const data = await getAllCollections(db);
  const outputPath = path.join(__dirname, "firestore-export.json");

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`✅ Export complete! Saved to ${outputPath}`);
})();
