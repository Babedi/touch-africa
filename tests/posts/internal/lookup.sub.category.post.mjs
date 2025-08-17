/**
 * Lookup Sub Category Module - POST Test Script
 *
 * This script demonstrates how to interact with the lookupSubCategory module
 * using HTTP requests. It includes examples for all CRUD operations.
 *
 * Usage:
 * node tests/posts/internal/lookup.sub.category.post.mjs
 *
 * Requirements:
 * - Server running on localhost:5000
 * - Valid JWT token in token.txt file
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const BASE_URL = "http://localhost:5000";
const TOKEN_FILE = resolve(__dirname, "../../../token.txt");
const PAYLOAD_FILE = resolve(
  __dirname,
  "../../payloads/internal/lookup.sub.category.payload.json"
);

// Get JWT token
function getAuthToken() {
  try {
    const token = readFileSync(TOKEN_FILE, "utf8").trim();
    if (!token) {
      throw new Error("Token file is empty");
    }
    return token;
  } catch (error) {
    console.error("❌ Failed to read token:", error.message);
    console.log('💡 Run "npm run make:token" to generate a token');
    process.exit(1);
  }
}

// Load test payload
function loadPayload() {
  try {
    const payload = readFileSync(PAYLOAD_FILE, "utf8");
    return JSON.parse(payload);
  } catch (error) {
    console.error("❌ Failed to load payload:", error.message);
    // Fallback payload
    return {
      subcategory: "Geography",
      description:
        "Major countries for international operations and user registration",
    };
  }
}

// HTTP request helper
async function httpRequest(method, endpoint, data = null) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getAuthToken()}`,
  };

  const options = {
    method,
    headers,
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  console.log(`\n🔄 ${method} ${endpoint}`);
  if (data) {
    console.log("📤 Request Body:", JSON.stringify(data, null, 2));
  }

  try {
    const response = await fetch(url, options);
    const responseData = await response.json();

    console.log(`📨 Status: ${response.status}`);
    console.log("📥 Response:", JSON.stringify(responseData, null, 2));

    return {
      status: response.status,
      success: response.ok,
      data: responseData,
    };
  } catch (error) {
    console.error(`❌ Request failed:`, error.message);
    return {
      status: 0,
      success: false,
      error: error.message,
    };
  }
}

// Test scenarios
async function demonstrateCreateLookupSubCategory() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 DEMO: Create Lookup Sub Category");
  console.log("=".repeat(60));

  const testData = loadPayload();

  const result = await httpRequest(
    "POST",
    "/internal/lookupSubCategory",
    testData
  );

  if (result.success && result.data.success) {
    console.log(
      `✅ Successfully created lookup sub category with ID: ${result.data.data.id}`
    );
    return result.data.data.id;
  } else {
    console.error("❌ Failed to create lookup sub category");
    return null;
  }
}

async function demonstrateGetLookupSubCategories() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 DEMO: Get All Lookup Sub Categories");
  console.log("=".repeat(60));

  await httpRequest("GET", "/internal/lookupSubCategory/list");
}

async function demonstrateGetLookupSubCategoryById(id) {
  if (!id) return;

  console.log("\n" + "=".repeat(60));
  console.log("🧪 DEMO: Get Lookup Sub Category by ID");
  console.log("=".repeat(60));

  await httpRequest("GET", `/internal/lookupSubCategory/${id}`);
}

async function demonstrateUpdateLookupSubCategory(id) {
  if (!id) return;

  console.log("\n" + "=".repeat(60));
  console.log("🧪 DEMO: Update Lookup Sub Category");
  console.log("=".repeat(60));

  const updateData = {
    subcategory: "Geographic Regions",
    description:
      "Updated geographic regions for international operations and user registration",
  };

  await httpRequest("PUT", `/internal/lookupSubCategory/${id}`, updateData);
}

async function demonstrateSearchLookupSubCategories() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 DEMO: Search Lookup Sub Categories");
  console.log("=".repeat(60));

  await httpRequest(
    "GET",
    "/internal/lookupSubCategory/search?subcategory=Geographic"
  );
}

async function demonstrateCheckExists(id) {
  if (!id) return;

  console.log("\n" + "=".repeat(60));
  console.log("🧪 DEMO: Check Lookup Sub Category Exists");
  console.log("=".repeat(60));

  await httpRequest("GET", `/internal/lookupSubCategory/${id}/exists`);
}

async function demonstrateDeleteLookupSubCategory(id) {
  if (!id) return;

  console.log("\n" + "=".repeat(60));
  console.log("🧪 DEMO: Delete Lookup Sub Category");
  console.log("=".repeat(60));

  await httpRequest("DELETE", `/internal/lookupSubCategory/${id}`);
}

async function demonstrateValidationErrors() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 DEMO: Validation Errors");
  console.log("=".repeat(60));

  // Test with invalid data
  const invalidData = {
    subcategory: "A", // Too short (minimum 3 characters)
    description: "B", // Too short (minimum 3 characters)
  };

  await httpRequest("POST", "/internal/lookupSubCategory", invalidData);
}

async function demonstrateUnauthorizedAccess() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 DEMO: Unauthorized Access");
  console.log("=".repeat(60));

  const url = `${BASE_URL}/internal/lookupSubCategory/list`;
  console.log(`\n🔄 GET ${url} (without auth)`);

  try {
    const response = await fetch(url);
    const responseData = await response.json();

    console.log(`📨 Status: ${response.status}`);
    console.log("📥 Response:", JSON.stringify(responseData, null, 2));
  } catch (error) {
    console.error(`❌ Request failed:`, error.message);
  }
}

// Curl equivalents for manual testing
function showCurlExamples() {
  const token = getAuthToken();

  console.log("\n" + "=".repeat(60));
  console.log("📋 CURL COMMAND EXAMPLES");
  console.log("=".repeat(60));

  console.log("\n1️⃣ Create Lookup Sub Category:");
  console.log(`curl -X POST "${BASE_URL}/internal/lookupSubCategory" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  -d '{
    "subcategory": "Technology",
    "description": "Technology-related subcategories for digital operations"
  }'`);

  console.log("\n2️⃣ Get All Lookup Sub Categories:");
  console.log(`curl -X GET "${BASE_URL}/internal/lookupSubCategory/list" \\
  -H "Authorization: Bearer ${token}"`);

  console.log("\n3️⃣ Get Lookup Sub Category by ID:");
  console.log(`curl -X GET "${BASE_URL}/internal/lookupSubCategory/{id}" \\
  -H "Authorization: Bearer ${token}"`);

  console.log("\n4️⃣ Update Lookup Sub Category:");
  console.log(`curl -X PUT "${BASE_URL}/internal/lookupSubCategory/{id}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  -d '{
    "subcategory": "Updated Technology",
    "description": "Updated technology-related subcategories for digital operations"
  }'`);

  console.log("\n5️⃣ Search Lookup Sub Categories:");
  console.log(`curl -X GET "${BASE_URL}/internal/lookupSubCategory/search?subcategory=Technology" \\
  -H "Authorization: Bearer ${token}"`);

  console.log("\n6️⃣ Check if Lookup Sub Category Exists:");
  console.log(`curl -X GET "${BASE_URL}/internal/lookupSubCategory/{id}/exists" \\
  -H "Authorization: Bearer ${token}"`);

  console.log("\n7️⃣ Delete Lookup Sub Category:");
  console.log(`curl -X DELETE "${BASE_URL}/internal/lookupSubCategory/{id}" \\
  -H "Authorization: Bearer ${token}"`);
}

// Main execution
async function runDemo() {
  console.log("🚀 Lookup Sub Category Module - Interactive Demo");
  console.log("This script demonstrates all available endpoints");

  let createdId = null;

  try {
    // Demo all operations
    createdId = await demonstrateCreateLookupSubCategory();
    await demonstrateGetLookupSubCategories();
    await demonstrateGetLookupSubCategoryById(createdId);
    await demonstrateSearchLookupSubCategories();
    await demonstrateCheckExists(createdId);
    await demonstrateUpdateLookupSubCategory(createdId);
    await demonstrateValidationErrors();
    await demonstrateUnauthorizedAccess();

    // Show curl examples
    showCurlExamples();

    // Cleanup
    await demonstrateDeleteLookupSubCategory(createdId);

    console.log("\n" + "=".repeat(60));
    console.log("✅ Demo completed successfully!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ Demo failed:", error.message);
  }
}

// Run the demo
runDemo().catch(console.error);
