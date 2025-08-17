#!/usr/bin/env node

/**
 * Add more features to Firestore for testing cycling functionality
 */

import fetch from "node-fetch";
import fs from "fs";

// Read token for authentication
let token;
try {
  token = fs.readFileSync("./token.txt", "utf8").trim();
  if (!token) {
    console.log("❌ No token found in token.txt");
    process.exit(1);
  }
} catch (error) {
  console.log("❌ Failed to read token:", error.message);
  process.exit(1);
}

const additionalFeatures = [
  {
    title: "Real-time Monitoring",
    text: "24/7 monitoring and immediate response coordination with advanced tracking systems for comprehensive security coverage.",
  },
  {
    title: "Mobile Integration",
    text: "Native mobile app support with push notifications, GPS tracking, and offline emergency capabilities for on-the-go security.",
  },
  {
    title: "Advanced Analytics",
    text: "Comprehensive reporting and analytics dashboard with incident trends, response times, and performance metrics.",
  },
  {
    title: "Custom Automation",
    text: "Automated response workflows and smart triggers that activate appropriate responses based on emergency types and severity.",
  },
];

async function addFeaturesToServiceInfo() {
  console.log("🔧 Adding Additional Features for Cycling Test");
  console.log("==============================================");

  try {
    // First get current service info
    console.log("📋 Step 1: Getting current service info...");
    const getResponse = await fetch(
      "http://localhost:5000/general/serviceInfo",
      {
        method: "GET",
      }
    );

    if (!getResponse.ok) {
      console.log("❌ Failed to get current service info:", getResponse.status);
      return false;
    }

    const currentData = await getResponse.json();
    console.log(
      `✅ Current features: ${currentData.data.features?.length || 0}`
    );

    // Merge with additional features
    const existingFeatures = currentData.data.features || [];
    const allFeatures = [...existingFeatures, ...additionalFeatures];

    console.log(`📊 Total features after addition: ${allFeatures.length}`);

    // Update service info with additional features
    console.log(
      "\n📋 Step 2: Updating service info with additional features..."
    );

    const updateData = {
      ...currentData.data,
      features: allFeatures,
    };

    const putResponse = await fetch(
      "http://localhost:5000/general/serviceInfo",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!putResponse.ok) {
      console.log("❌ Failed to update service info:", putResponse.status);
      const errorText = await putResponse.text();
      console.log("Error details:", errorText);
      return false;
    }

    const updateResult = await putResponse.json();
    console.log("✅ Service info updated successfully");
    console.log(`✅ Total features now: ${updateResult.data.features.length}`);

    return true;
  } catch (error) {
    console.log("❌ Error adding features:", error.message);
    return false;
  }
}

async function verifyFeaturesEndpoint() {
  console.log("\n📋 Step 3: Verifying features endpoint...");

  try {
    const response = await fetch(
      "http://localhost:5000/general/serviceInfo/features"
    );

    if (!response.ok) {
      console.log("❌ Features endpoint failed:", response.status);
      return false;
    }

    const data = await response.json();
    console.log("✅ Features endpoint working");
    console.log(`📊 Features available for cycling: ${data.data.length}`);

    if (data.data.length > 4) {
      const maxSets = Math.ceil(data.data.length / 4);
      console.log(`🔄 Will create ${maxSets} cycling sets`);

      console.log("\n🎨 Feature sets that will cycle:");
      for (let i = 0; i < maxSets; i++) {
        const start = i * 4;
        const features = data.data.slice(start, start + 4);
        console.log(
          `  Set ${i + 1}: ${features.map((f) => f.title).join(", ")}`
        );
      }
    }

    return true;
  } catch (error) {
    console.log("❌ Error verifying features endpoint:", error.message);
    return false;
  }
}

async function runSetup() {
  console.log("🚀 Setting Up Features Cycling Test Data");
  console.log(`Time: ${new Date().toISOString()}`);
  console.log("=========================================");

  const added = await addFeaturesToServiceInfo();
  const verified = await verifyFeaturesEndpoint();

  console.log("\n📊 Setup Results");
  console.log("=================");
  console.log(`✅ Features Added: ${added ? "SUCCESS" : "FAILED"}`);
  console.log(`✅ Endpoint Verified: ${verified ? "SUCCESS" : "FAILED"}`);

  if (added && verified) {
    console.log("\n🎉 Cycling test data setup complete!");
    console.log("\n📍 Next steps:");
    console.log("  1. Run: node test-features-cycling.mjs");
    console.log("  2. Open browser to see cycling in action");
    console.log("  3. Watch features cycle every 8 seconds");
  }

  console.log("\n🏁 Setup completed");
}

// Run the setup
runSetup().catch(console.error);
