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

// Helper function to make HTTP requests
async function makeRequest(method, endpoint, data = null) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const options = {
    method,
    headers,
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.text();

    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch {
      parsedResult = result;
    }

    return {
      status: response.status,
      ok: response.ok,
      data: parsedResult,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

// Test data
const validAdminData = {
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

const loginData = {
  email: "sl.babedi@neighbourguard.co.za",
  password: "SecureAdminPass123",
};

const updateData = {
  names: "Simon Updated",
  surname: "Babedi Updated",
};

// Test functions
async function testCreateAdmin() {
  console.log("\n🧪 Testing POST /internal/admin (Create Admin)");
  const result = await makeRequest("POST", "/internal/admin", validAdminData);

  console.log(`Status: ${result.status}`);
  if (result.ok) {
    console.log("✅ Admin created successfully");
    console.log("📄 Response:", JSON.stringify(result.data, null, 2));
    return result.data.data.id; // Return the created admin ID
  } else {
    console.log("❌ Failed to create admin");
    console.log("📄 Error:", JSON.stringify(result.data, null, 2));
    return null;
  }
}

async function testLogin() {
  console.log("\n🧪 Testing POST /internal/admin/login (Login)");
  const result = await makeRequest("POST", "/internal/admin/login", loginData);

  console.log(`Status: ${result.status}`);
  if (result.ok) {
    console.log("✅ Login successful");
    console.log("📄 Response:", JSON.stringify(result.data, null, 2));
    return result.data.data.token; // Return the token
  } else {
    console.log("❌ Failed to login");
    console.log("📄 Error:", JSON.stringify(result.data, null, 2));
    return null;
  }
}

async function testGetMe() {
  console.log("\n🧪 Testing GET /internal/admin/me (Get Current Admin)");
  const result = await makeRequest("GET", "/internal/admin/me");

  console.log(`Status: ${result.status}`);
  if (result.ok) {
    console.log("✅ Retrieved current admin successfully");
    console.log("📄 Response:", JSON.stringify(result.data, null, 2));
  } else {
    console.log("❌ Failed to get current admin");
    console.log("📄 Error:", JSON.stringify(result.data, null, 2));
  }
}

async function testListAdmins() {
  console.log("\n🧪 Testing GET /internal/admin/list (List All Admins)");
  const result = await makeRequest("GET", "/internal/admin/list");

  console.log(`Status: ${result.status}`);
  if (result.ok) {
    console.log("✅ Retrieved admin list successfully");
    console.log("📄 Response:", JSON.stringify(result.data, null, 2));
  } else {
    console.log("❌ Failed to get admin list");
    console.log("📄 Error:", JSON.stringify(result.data, null, 2));
  }
}

async function testGetAdminById(adminId) {
  console.log(`\n🧪 Testing GET /internal/admin/${adminId} (Get Admin by ID)`);
  const result = await makeRequest("GET", `/internal/admin/${adminId}`);

  console.log(`Status: ${result.status}`);
  if (result.ok) {
    console.log("✅ Retrieved admin by ID successfully");
    console.log("📄 Response:", JSON.stringify(result.data, null, 2));
  } else {
    console.log("❌ Failed to get admin by ID");
    console.log("📄 Error:", JSON.stringify(result.data, null, 2));
  }
}

async function testUpdateAdmin(adminId) {
  console.log(`\n🧪 Testing PUT /internal/admin/${adminId} (Update Admin)`);
  const result = await makeRequest(
    "PUT",
    `/internal/admin/${adminId}`,
    updateData
  );

  console.log(`Status: ${result.status}`);
  if (result.ok) {
    console.log("✅ Updated admin successfully");
    console.log("📄 Response:", JSON.stringify(result.data, null, 2));
  } else {
    console.log("❌ Failed to update admin");
    console.log("📄 Error:", JSON.stringify(result.data, null, 2));
  }
}

async function testActivateAdmin(adminId) {
  console.log(
    `\n🧪 Testing PUT /internal/admin/${adminId}/activate (Activate Admin)`
  );
  const result = await makeRequest(
    "PUT",
    `/internal/admin/${adminId}/activate`
  );

  console.log(`Status: ${result.status}`);
  if (result.ok) {
    console.log("✅ Activated admin successfully");
    console.log("📄 Response:", JSON.stringify(result.data, null, 2));
  } else {
    console.log("❌ Failed to activate admin");
    console.log("📄 Error:", JSON.stringify(result.data, null, 2));
  }
}

async function testDeactivateAdmin(adminId) {
  console.log(
    `\n🧪 Testing PUT /internal/admin/${adminId}/deactivate (Deactivate Admin)`
  );
  const result = await makeRequest(
    "PUT",
    `/internal/admin/${adminId}/deactivate`
  );

  console.log(`Status: ${result.status}`);
  if (result.ok) {
    console.log("✅ Deactivated admin successfully");
    console.log("📄 Response:", JSON.stringify(result.data, null, 2));
  } else {
    console.log("❌ Failed to deactivate admin");
    console.log("📄 Error:", JSON.stringify(result.data, null, 2));
  }
}

async function testDeleteAdmin(adminId) {
  console.log(`\n🧪 Testing DELETE /internal/admin/${adminId} (Delete Admin)`);
  const result = await makeRequest("DELETE", `/internal/admin/${adminId}`);

  console.log(`Status: ${result.status}`);
  if (result.ok) {
    console.log("✅ Deleted admin successfully");
    console.log("📄 Response:", JSON.stringify(result.data, null, 2));
  } else {
    console.log("❌ Failed to delete admin");
    console.log("📄 Error:", JSON.stringify(result.data, null, 2));
  }
}

async function testLogout() {
  console.log("\n🧪 Testing POST /internal/admin/logout (Logout)");
  const result = await makeRequest("POST", "/internal/admin/logout");

  console.log(`Status: ${result.status}`);
  if (result.ok) {
    console.log("✅ Logout successful");
    console.log("📄 Response:", JSON.stringify(result.data, null, 2));
  } else {
    console.log("❌ Failed to logout");
    console.log("📄 Error:", JSON.stringify(result.data, null, 2));
  }
}

// Main test runner
async function runAllTests() {
  console.log("🚀 Starting Internal Admin E2E Tests...");

  // Test 1: Create Admin
  const adminId = await testCreateAdmin();
  if (!adminId) {
    console.log("❌ Cannot continue tests without created admin ID");
    return;
  }

  // Test 2: Login
  const token = await testLogin();
  if (token) {
    // Update auth token for subsequent requests
    authToken = token;
  }

  // Test 3: Get current admin info
  await testGetMe();

  // Test 4: List all admins
  await testListAdmins();

  // Test 5: Get admin by ID
  await testGetAdminById(adminId);

  // Test 6: Update admin
  await testUpdateAdmin(adminId);

  // Test 7: Activate admin
  await testActivateAdmin(adminId);

  // Test 8: Deactivate admin
  await testDeactivateAdmin(adminId);

  // Test 9: Logout
  await testLogout();

  // Test 10: Delete admin (Note: This might fail if it's a root admin)
  await testDeleteAdmin(adminId);

  console.log("\n✅ All tests completed!");
}

// Run the tests
runAllTests().catch(console.error);
