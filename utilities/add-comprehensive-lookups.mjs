#!/usr/bin/env node

import fs from "fs";
import fetch from "node-fetch";

const BASE_URL = "http://localhost:5000";
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

// Lookup data to be added
const lookupData = [
  {
    category: "Geography",
    subCategory: "Countries",
    items: [
      "South Africa",
      "United States",
      "United Kingdom",
      "India",
      "China",
      "Australia",
      "Canada",
      "Germany",
      "France",
      "Japan",
      "Brazil",
      "Russia",
      "Mexico",
      "Italy",
      "Spain",
      "Netherlands",
      "Sweden",
      "Norway",
      "Denmark",
      "Finland",
    ],
    description:
      "Major countries for international operations and user registration",
  },
  {
    category: "Geography",
    subCategory: "Provinces",
    items: [
      "Eastern Cape",
      "Free State",
      "Gauteng",
      "KwaZulu-Natal",
      "Limpopo",
      "Mpumalanga",
      "Northern Cape",
      "North West",
      "Western Cape",
    ],
    description:
      "Administrative divisions of South Africa, used for address and service mapping",
  },
  {
    category: "Finance",
    subCategory: "Currencies",
    items: ["ZAR", "USD", "EUR", "GBP", "INR"],
    description: "Supported currencies for payments and financial reporting",
  },
  {
    category: "Culture",
    subCategory: "Languages",
    items: [
      "English",
      "Afrikaans",
      "Zulu",
      "Xhosa",
      "Sotho",
      "Tswana",
      "Venda",
      "Tsonga",
      "Swati",
      "Northern Sotho",
      "Ndebele",
    ],
    description:
      "Languages supported for communication, localization, and user interaction",
  },
  {
    category: "System",
    subCategory: "Time Zones",
    items: ["UTC", "GMT+2", "EST", "PST", "CET"],
    description:
      "Time zones for scheduling, logging, and international coordination",
  },
  {
    category: "User Management",
    subCategory: "Roles",
    items: ["Admin", "Editor", "Viewer", "Moderator", "User"],
    description: "User roles for access control and permissions in the system",
  },
  {
    category: "User Management",
    subCategory: "Permissions",
    items: ["Read", "Write", "Update", "Delete", "Approve"],
    description: "Granular access rights assigned to user roles",
  },
  {
    category: "User Profile",
    subCategory: "Genders",
    items: ["Male", "Female", "Non-binary", "Other", "Prefer not to say"],
    description: "Gender options for user profiles and demographic data",
  },
  {
    category: "User Profile",
    subCategory: "Marital Status",
    items: ["Single", "Married", "Divorced", "Widowed"],
    description: "Marital status options for demographic and survey data",
  },
  {
    category: "User Profile",
    subCategory: "Titles",
    items: ["Mr", "Mrs", "Ms", "Dr", "Prof", "Miss", "Rev", "Sir"],
    description: "Common personal titles for users in formal communication",
  },
];

// Make authenticated request
async function postLookup(data) {
  const token = getToken();

  try {
    const response = await fetch(`${BASE_URL}/internal/lookup`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    return { status: 500, data: { success: false, error: error.message } };
  }
}

// Add all lookup data
async function addAllLookups() {
  console.log("=".repeat(70));
  console.log("🚀 ADDING COMPREHENSIVE LOOKUP DATA TO DATABASE");
  console.log("=".repeat(70));

  let successCount = 0;
  let failureCount = 0;
  const results = [];

  for (let i = 0; i < lookupData.length; i++) {
    const lookup = lookupData[i];
    console.log(
      `\n📝 [${i + 1}/${lookupData.length}] Adding: ${lookup.category} > ${
        lookup.subCategory
      }`
    );
    console.log(`   Items: ${lookup.items.length} entries`);
    console.log(`   Description: ${lookup.description.substring(0, 60)}...`);

    const result = await postLookup(lookup);

    if (result.status === 201 && result.data.success) {
      console.log(`   ✅ SUCCESS - ID: ${result.data.data.id}`);
      successCount++;
      results.push({
        category: lookup.category,
        subCategory: lookup.subCategory,
        id: result.data.data.id,
        status: "success",
      });
    } else {
      console.log(`   ❌ FAILED - Status: ${result.status}`);
      console.log(`   Error: ${result.data.error || "Unknown error"}`);
      failureCount++;
      results.push({
        category: lookup.category,
        subCategory: lookup.subCategory,
        status: "failed",
        error: result.data.error,
      });
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("\n" + "=".repeat(70));
  console.log("📊 SUMMARY REPORT");
  console.log("=".repeat(70));
  console.log(`✅ Successfully added: ${successCount} lookups`);
  console.log(`❌ Failed to add: ${failureCount} lookups`);
  console.log(
    `📈 Success rate: ${Math.round((successCount / lookupData.length) * 100)}%`
  );

  if (successCount > 0) {
    console.log("\n🎯 Successfully Added Lookups:");
    results
      .filter((r) => r.status === "success")
      .forEach((r) => {
        console.log(`   • ${r.category} > ${r.subCategory} (ID: ${r.id})`);
      });
  }

  if (failureCount > 0) {
    console.log("\n💥 Failed Lookups:");
    results
      .filter((r) => r.status === "failed")
      .forEach((r) => {
        console.log(`   • ${r.category} > ${r.subCategory} - ${r.error}`);
      });
  }

  console.log("\n" + "=".repeat(70));
  if (successCount === lookupData.length) {
    console.log("🎉 ALL LOOKUP DATA SUCCESSFULLY ADDED TO DATABASE!");
  } else if (successCount > 0) {
    console.log(
      "⚠️  PARTIAL SUCCESS - Some lookups were added, check failures above"
    );
  } else {
    console.log("💥 NO LOOKUPS WERE ADDED - Check server and authentication");
  }
  console.log("=".repeat(70));
}

// Run the script
addAllLookups().catch(console.error);
