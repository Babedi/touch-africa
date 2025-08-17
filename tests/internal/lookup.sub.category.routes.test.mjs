/**
 * Comprehensive E2E Test: Lookup Sub Category Module Routes
 *
 * This script tests all CRUD operations for the lookupSubCategory module:
 * - POST /internal/lookupSubCategory
 * - GET /internal/lookupSubCategory/list
 * - GET /internal/lookupSubCategory/:id
 * - PUT /internal/lookupSubCategory/:id
 * - DELETE /internal/lookupSubCategory/:id
 * - GET /internal/lookupSubCategory/search
 * - GET /internal/lookupSubCategory/:id/exists
 *
 * Requirements:
 * - Server running on localhost:5000
 * - Valid JWT token in token.txt file
 * - Authentication middleware configured
 * - Authorization roles properly set
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const BASE_URL = "http://localhost:5000";
const TOKEN_FILE = resolve(__dirname, "../token.txt");

// Helper function to read JWT token
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

// Helper function to make HTTP requests
async function makeRequest(method, endpoint, data = null, useAuth = true) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
  };

  if (useAuth) {
    headers["Authorization"] = `Bearer ${getAuthToken()}`;
  }

  const options = {
    method,
    headers,
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const responseData = await response.json();

    return {
      status: response.status,
      success: response.ok,
      data: responseData,
    };
  } catch (error) {
    console.error(
      `❌ Request failed for ${method} ${endpoint}:`,
      error.message
    );
    return {
      status: 0,
      success: false,
      error: error.message,
    };
  }
}

// Test data
const testLookupSubCategory = {
  subcategory: "Geography",
  description:
    "Major countries for international operations and user registration",
};

const updatedLookupSubCategory = {
  subcategory: "Geographic Regions",
  description:
    "Updated geographic regions for international operations and user registration",
};

// Test functions
async function testCreateLookupSubCategory() {
  console.log("\n🧪 Testing CREATE Lookup Sub Category...");

  const result = await makeRequest(
    "POST",
    "/internal/lookupSubCategory",
    testLookupSubCategory
  );

  if (result.success && result.data.success) {
    console.log("✅ CREATE Success:", result.data.data.id);
    return result.data.data.id;
  } else {
    console.error("❌ CREATE Failed:", result.data.error || result.error);
    return null;
  }
}

async function testGetAllLookupSubCategories() {
  console.log("\n🧪 Testing GET ALL Lookup Sub Categories...");

  const result = await makeRequest("GET", "/internal/lookupSubCategory/list");

  if (result.success && result.data.success) {
    console.log(
      `✅ GET ALL Success: ${result.data.data.length} lookup sub categories found`
    );
    return true;
  } else {
    console.error("❌ GET ALL Failed:", result.data.error || result.error);
    return false;
  }
}

async function testGetLookupSubCategoryById(id) {
  console.log(`\n🧪 Testing GET Lookup Sub Category by ID: ${id}`);

  const result = await makeRequest("GET", `/internal/lookupSubCategory/${id}`);

  if (result.success && result.data.success) {
    console.log("✅ GET BY ID Success:", result.data.data.subcategory);
    return true;
  } else {
    console.error("❌ GET BY ID Failed:", result.data.error || result.error);
    return false;
  }
}

async function testUpdateLookupSubCategory(id) {
  console.log(`\n🧪 Testing UPDATE Lookup Sub Category: ${id}`);

  const result = await makeRequest(
    "PUT",
    `/internal/lookupSubCategory/${id}`,
    updatedLookupSubCategory
  );

  if (result.success && result.data.success) {
    console.log("✅ UPDATE Success:", result.data.data.subcategory);
    return true;
  } else {
    console.error("❌ UPDATE Failed:", result.data.error || result.error);
    return false;
  }
}

async function testSearchLookupSubCategories() {
  console.log("\n🧪 Testing SEARCH Lookup Sub Categories...");

  const result = await makeRequest(
    "GET",
    "/internal/lookupSubCategory/search?subcategory=Geographic"
  );

  if (result.success && result.data.success) {
    console.log(`✅ SEARCH Success: ${result.data.data.length} matches found`);
    return true;
  } else {
    console.error("❌ SEARCH Failed:", result.data.error || result.error);
    return false;
  }
}

async function testCheckLookupSubCategoryExists(id) {
  console.log(`\n🧪 Testing CHECK EXISTS for: ${id}`);

  const result = await makeRequest(
    "GET",
    `/internal/lookupSubCategory/${id}/exists`
  );

  if (result.success && result.data.success) {
    console.log(`✅ CHECK EXISTS Success: ${result.data.data.exists}`);
    return true;
  } else {
    console.error("❌ CHECK EXISTS Failed:", result.data.error || result.error);
    return false;
  }
}

async function testDeleteLookupSubCategory(id) {
  console.log(`\n🧪 Testing DELETE Lookup Sub Category: ${id}`);

  const result = await makeRequest(
    "DELETE",
    `/internal/lookupSubCategory/${id}`
  );

  if (result.success && result.data.success) {
    console.log("✅ DELETE Success");
    return true;
  } else {
    console.error("❌ DELETE Failed:", result.data.error || result.error);
    return false;
  }
}

async function testUnauthorizedAccess() {
  console.log("\n🧪 Testing UNAUTHORIZED Access...");

  const result = await makeRequest(
    "GET",
    "/internal/lookupSubCategory/list",
    null,
    false
  );

  if (!result.success && result.status === 401) {
    console.log("✅ UNAUTHORIZED properly blocked");
    return true;
  } else {
    console.error("❌ UNAUTHORIZED not properly blocked");
    return false;
  }
}

async function testInvalidData() {
  console.log("\n🧪 Testing INVALID Data validation...");

  const invalidData = {
    subcategory: "A", // Too short
    description: "B", // Too short
  };

  const result = await makeRequest(
    "POST",
    "/internal/lookupSubCategory",
    invalidData
  );

  if (!result.success && result.status === 400) {
    console.log("✅ INVALID DATA properly rejected");
    return true;
  } else {
    console.error("❌ INVALID DATA not properly rejected");
    return false;
  }
}

// Main test execution
async function runAllTests() {
  console.log("🚀 Starting Lookup Sub Category Module E2E Tests");
  console.log("=".repeat(60));

  let testsPassed = 0;
  let totalTests = 0;
  let createdId = null;

  // Test 1: Unauthorized access
  totalTests++;
  if (await testUnauthorizedAccess()) testsPassed++;

  // Test 2: Invalid data validation
  totalTests++;
  if (await testInvalidData()) testsPassed++;

  // Test 3: Create lookup sub category
  totalTests++;
  createdId = await testCreateLookupSubCategory();
  if (createdId) testsPassed++;

  if (createdId) {
    // Test 4: Get all lookup sub categories
    totalTests++;
    if (await testGetAllLookupSubCategories()) testsPassed++;

    // Test 5: Get lookup sub category by ID
    totalTests++;
    if (await testGetLookupSubCategoryById(createdId)) testsPassed++;

    // Test 6: Check if lookup sub category exists
    totalTests++;
    if (await testCheckLookupSubCategoryExists(createdId)) testsPassed++;

    // Test 7: Search lookup sub categories
    totalTests++;
    if (await testSearchLookupSubCategories()) testsPassed++;

    // Test 8: Update lookup sub category
    totalTests++;
    if (await testUpdateLookupSubCategory(createdId)) testsPassed++;

    // Test 9: Delete lookup sub category
    totalTests++;
    if (await testDeleteLookupSubCategory(createdId)) testsPassed++;

    // Test 10: Verify deletion
    totalTests++;
    const result = await makeRequest(
      "GET",
      `/internal/lookupSubCategory/${createdId}`
    );
    if (!result.success && result.status === 404) {
      console.log(
        "\n✅ VERIFY DELETION Success: Lookup sub category not found after deletion"
      );
      testsPassed++;
    } else {
      console.error(
        "\n❌ VERIFY DELETION Failed: Lookup sub category still exists"
      );
    }
  }

  // Results summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST RESULTS SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${totalTests - testsPassed}`);
  console.log(
    `📈 Success Rate: ${((testsPassed / totalTests) * 100).toFixed(1)}%`
  );

  if (testsPassed === totalTests) {
    console.log(
      "\n🎉 ALL TESTS PASSED! Lookup Sub Category module is working correctly."
    );
  } else {
    console.log("\n⚠️  Some tests failed. Please check the output above.");
  }

  // Check server health
  console.log("\n🔍 Checking server health...");
  const healthResult = await makeRequest(
    "GET",
    "/internal/health",
    null,
    false
  );
  if (healthResult.success) {
    console.log("✅ Server is healthy");
  } else {
    console.log("❌ Server health check failed");
  }
}

// Execute tests
runAllTests().catch(console.error);
