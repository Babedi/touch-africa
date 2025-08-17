#!/usr/bin/env node

import fs from "fs";
import fetch from "node-fetch";

const BASE_URL = "http://localhost:5001";
const TOKEN_FILE = "token.txt";

// Read token from file
function getToken() {
  try {
    return fs.readFileSync(TOKEN_FILE, "utf8").trim();
  } catch (error) {
    console.error("❌ Error reading token file:", error.message);
    console.log("💡 Generate a token first: npm run make:token");
    process.exit(1);
  }
}

// Load test payload
function loadPayload() {
  try {
    const payload = fs.readFileSync(
      "tests/payloads/internal/lookup.payload.json",
      "utf8"
    );
    return JSON.parse(payload);
  } catch (error) {
    console.error("❌ Error loading payload:", error.message);
    process.exit(1);
  }
}

// Create lookup
async function createLookup() {
  console.log("🚀 Creating lookup with payload...");

  const token = getToken();
  const payload = loadPayload();

  console.log("📝 Payload:");
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(`${BASE_URL}/internal/lookup`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    console.log("\n📊 Response:");
    console.log("Status:", response.status);
    console.log("Data:", JSON.stringify(result, null, 2));

    if (response.status === 201 && result.success) {
      console.log("\n✅ SUCCESS: Lookup created successfully!");
      console.log("🆔 Created ID:", result.data.id);
    } else {
      console.log("\n❌ FAILED: Lookup creation failed");
    }
  } catch (error) {
    console.error("\n💥 ERROR:", error.message);
  }
}

// Run the post request
createLookup();
