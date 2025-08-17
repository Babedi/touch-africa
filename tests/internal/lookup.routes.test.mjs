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

// Make authenticated request
async function makeRequest(method, url, data = null) {
  const token = getToken();
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    return { status: 500, data: { success: false, error: error.message } };
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

// Test functions
async function testCreateLookup() {
  console.log("\n🧪 Testing POST /internal/lookup (Create)");
  const payload = loadPayload();
  const result = await makeRequest(
    "POST",
    `${BASE_URL}/internal/lookup`,
    payload
  );

  if (result.status === 201 && result.data.success) {
    console.log("✅ Create lookup: SUCCESS");
    return result.data.data.id;
  } else {
    console.log("❌ Create lookup: FAILED");
    console.log("Status:", result.status);
    console.log("Response:", result.data);
    return null;
  }
}

async function testGetLookup(id) {
  console.log("\n🧪 Testing GET /internal/lookup/:id");
  const result = await makeRequest("GET", `${BASE_URL}/internal/lookup/${id}`);

  if (result.status === 200 && result.data.success) {
    console.log("✅ Get lookup: SUCCESS");
    return true;
  } else {
    console.log("❌ Get lookup: FAILED");
    console.log("Status:", result.status);
    console.log("Response:", result.data);
    return false;
  }
}

async function testUpdateLookup(id) {
  console.log("\n🧪 Testing PUT /internal/lookup/:id");
  const updateData = {
    description: "Updated description for testing purposes",
  };
  const result = await makeRequest(
    "PUT",
    `${BASE_URL}/internal/lookup/${id}`,
    updateData
  );

  if (result.status === 200 && result.data.success) {
    console.log("✅ Update lookup: SUCCESS");
    return true;
  } else {
    console.log("❌ Update lookup: FAILED");
    console.log("Status:", result.status);
    console.log("Response:", result.data);
    return false;
  }
}

async function testGetAllLookups() {
  console.log("\n🧪 Testing GET /internal/lookup/list");
  const result = await makeRequest("GET", `${BASE_URL}/internal/lookup/list`);

  if (result.status === 200 && result.data.success) {
    console.log("✅ Get all lookups: SUCCESS");
    console.log(`📊 Found ${result.data.data.length} lookups`);
    return true;
  } else {
    console.log("❌ Get all lookups: FAILED");
    console.log("Status:", result.status);
    console.log("Response:", result.data);
    return false;
  }
}

async function testDeleteLookup(id) {
  console.log("\n🧪 Testing DELETE /internal/lookup/:id");
  const result = await makeRequest(
    "DELETE",
    `${BASE_URL}/internal/lookup/${id}`
  );

  if (result.status === 200 && result.data.success) {
    console.log("✅ Delete lookup: SUCCESS");
    return true;
  } else {
    console.log("❌ Delete lookup: FAILED");
    console.log("Status:", result.status);
    console.log("Response:", result.data);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log("=".repeat(60));
  console.log("🚀 LOOKUP MODULE E2E TESTS");
  console.log("=".repeat(60));

  let testId = null;
  let allPassed = true;

  // Test Create
  testId = await testCreateLookup();
  if (!testId) allPassed = false;

  // Test Get by ID
  if (testId) {
    const getSuccess = await testGetLookup(testId);
    if (!getSuccess) allPassed = false;
  }

  // Test Update
  if (testId) {
    const updateSuccess = await testUpdateLookup(testId);
    if (!updateSuccess) allPassed = false;
  }

  // Test Get All
  const getAllSuccess = await testGetAllLookups();
  if (!getAllSuccess) allPassed = false;

  // Test Delete
  if (testId) {
    const deleteSuccess = await testDeleteLookup(testId);
    if (!deleteSuccess) allPassed = false;
  }

  console.log("\n" + "=".repeat(60));
  if (allPassed) {
    console.log("🎉 ALL TESTS PASSED!");
  } else {
    console.log("💥 SOME TESTS FAILED!");
  }
  console.log("=".repeat(60));
}

// Run tests
runAllTests().catch(console.error);
