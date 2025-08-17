import fetch from "node-fetch";
import fs from "fs";

const BASE_URL = "http://localhost:5000";
let authToken = "";

// Load token from file
try {
  authToken = fs.readFileSync("token.txt", "utf8").trim();
  console.log("🔧 Using token from token.txt");
} catch (error) {
  console.error("❌ Could not read token from token.txt:", error.message);
  process.exit(1);
}

// Valid admin payload
const adminPayload = {
  roles: ["internalSuperAdmin"],
  title: "Mr",
  names: "Simon Lesedi",
  surname: "Babedi",
  accessDetails: {
    email: "sl.babedi@neighbourguard.co.za",
    password: "SecureAdminPass123",
  },
  account: {
    isActive: {
      value: true,
      changes: [],
    },
  },
};

async function postInternalAdmin() {
  console.log("🚀 Posting Internal Admin...");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authToken}`,
  };

  try {
    const response = await fetch(`${BASE_URL}/internal/admin`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(adminPayload),
    });

    const result = await response.text();
    let parsedResult;

    try {
      parsedResult = JSON.parse(result);
    } catch {
      parsedResult = result;
    }

    console.log(`Status: ${response.status}`);
    console.log(`OK: ${response.ok}`);

    if (response.ok) {
      console.log("✅ Internal Admin created successfully!");
      console.log("📄 Response:");
      console.log(JSON.stringify(parsedResult, null, 2));

      if (parsedResult.data && parsedResult.data.id) {
        console.log(`🆔 Admin ID: ${parsedResult.data.id}`);
      }
    } else {
      console.log("❌ Failed to create Internal Admin");
      console.log("📄 Error Response:");
      console.log(JSON.stringify(parsedResult, null, 2));
    }
  } catch (error) {
    console.error("❌ Network Error:", error.message);
  }
}

// Run the post
postInternalAdmin();
