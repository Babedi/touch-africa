#!/usr/bin/env node

/**
 * Test Firestore Connection
 */

import { db } from "./services/firestore.client.js";

async function testConnection() {
  try {
    console.log("🔍 Testing Firestore connection...");

    // Try to list collections
    const collections = await db.listCollections();
    console.log("✅ Firestore connection successful");
    console.log(`📁 Found ${collections.length} collections`);

    // Try to read from the tenants collection
    const tenantsRef = db.collection("touchAfrica/southAfrica/tenants");
    const snapshot = await tenantsRef.limit(1).get();
    console.log(
      `📊 Tenants collection exists, contains ${snapshot.size} documents`
    );

    return true;
  } catch (error) {
    console.error("❌ Firestore connection failed:", error.message);
    console.error("Full error:", error);
    return false;
  }
}

testConnection()
  .then((success) => {
    if (success) {
      console.log("🎉 Firestore test completed successfully!");
    } else {
      console.log("💥 Firestore test failed!");
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("💥 Test script failed:", error);
    process.exit(1);
  });
