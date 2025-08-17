import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, ".env") });

const API_BASE = "http://localhost:5000";

/**
 * Login as internal admin and get token
 */
async function getAdminToken() {
  const loginData = {
    email: "test.corrected@neighbourguard.co.za",
    password: "TestCorrected123!",
  };

  try {
    const response = await fetch(`${API_BASE}/internal/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    const data = await response.text();

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status} ${data}`);
    }

    const result = JSON.parse(data);

    if (result.success && result.data.token) {
      console.log("✅ Admin login successful");
      console.log(
        `   Admin: ${result.data.admin.names} ${result.data.admin.surname}`
      );
      console.log(`   Roles: ${result.data.admin.roles.join(", ")}`);
      return result.data.token;
    } else {
      throw new Error("Login failed: No token received");
    }
  } catch (error) {
    console.error("❌ Admin login failed:", error.message);
    return null;
  }
}

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, token, options = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  console.log(`🔍 DEBUG: Making request to ${endpoint}`);
  console.log(`🔍 DEBUG: Token length: ${token ? token.length : "undefined"}`);
  console.log(`🔍 DEBUG: Headers:`, Object.keys(headers));

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers,
    ...options,
  });

  const data = await response.text();

  if (!response.ok) {
    console.log(`🔍 DEBUG: Response status: ${response.status}`);
    console.log(`🔍 DEBUG: Response data: ${data.substring(0, 200)}`);
    throw new Error(`API Error ${response.status}: ${data}`);
  }

  return JSON.parse(data);
}

/**
 * Create tenant admin credentials
 */
async function createTenantAdmin(token, tenantId) {
  console.log(`\n📋 Creating Tenant Admin for tenant: ${tenantId}`);

  const tenantAdminData = {
    roles: ["tenantAdmin"],
    title: "Ms",
    names: "Sarah",
    surname: "Admin",
    accessDetails: {
      email: "sarah.admin@neighbourguard.co.za",
      password: "TenantAdminPass123!",
    },
    account: {
      isActive: {
        value: true,
        changes: [],
      },
    },
  };

  try {
    const response = await apiRequest(
      `/external/tenantAdmin/${tenantId}`,
      token,
      {
        method: "POST",
        headers: {
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify(tenantAdminData),
      }
    );

    console.log("✅ Tenant Admin created successfully");
    console.log(`   ID: ${response.data.id}`);
    console.log(`   Email: ${response.data.accessDetails.email}`);
    console.log(`   Password: TenantAdminPass123!`);

    return response.data;
  } catch (error) {
    console.error("❌ Failed to create tenant admin:", error.message);
    return null;
  }
}

/**
 * Create tenant user credentials
 */
async function createTenantUser(token, tenantId) {
  console.log(`\n📋 Creating Tenant User for tenant: ${tenantId}`);

  const tenantUserData = {
    title: "Mr",
    names: "John",
    surname: "Smith",
    subAddress: {
      streetOrFloor: "123 Main Street",
      unit: "Apt 4B",
    },
    activationDetails: {
      phoneNumber: "+27123456789",
      pin: "1234",
      preferredMenuLanguage: "English",
      isATester: false,
    },
  };

  try {
    const response = await apiRequest("/external/tenantUser", token, {
      method: "POST",
      headers: {
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify(tenantUserData),
    });

    console.log("✅ Tenant User created successfully");
    console.log(`   ID: ${response.data.id}`);
    console.log(`   Name: ${response.data.names} ${response.data.surname}`);
    console.log(`   Phone: ${response.data.activationDetails.phoneNumber}`);
    console.log(`   PIN: ${response.data.activationDetails.pin}`);

    return response.data;
  } catch (error) {
    console.error("❌ Failed to create tenant user:", error.message);
    return null;
  }
}

/**
 * Test tenant admin login
 */
async function testTenantAdminLogin(tenantName, email, password) {
  console.log(`\n🧪 Testing Tenant Admin Login`);

  const loginData = {
    tenantName: tenantName,
    email: email,
    password: password,
  };

  try {
    const response = await fetch(`${API_BASE}/external/tenantAdmin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    const data = await response.text();

    if (!response.ok) {
      console.error("❌ Login failed:", response.status, data);
      return false;
    }

    const result = JSON.parse(data);

    if (result.success && result.data.token) {
      console.log("✅ Tenant Admin login successful!");
      console.log(`   Token length: ${result.data.token.length}`);
      console.log(
        `   Admin: ${result.data.tenantAdmin.names} ${result.data.tenantAdmin.surname}`
      );
      return true;
    } else {
      console.error("❌ Login failed: No token received");
      return false;
    }
  } catch (error) {
    console.error("❌ Login test failed:", error.message);
    return false;
  }
}

/**
 * Test tenant user login
 */
async function testTenantUserLogin(tenantName, phoneNumber, pin) {
  console.log(`\n🧪 Testing Tenant User Login`);

  const loginData = {
    tenantName: tenantName,
    phoneNumber: phoneNumber,
    pin: pin,
  };

  try {
    const response = await fetch(`${API_BASE}/external/tenantUser/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    const data = await response.text();

    if (!response.ok) {
      console.error("❌ Login failed:", response.status, data);
      return false;
    }

    const result = JSON.parse(data);

    if (result.success && result.data.token) {
      console.log("✅ Tenant User login successful!");
      console.log(`   Token length: ${result.data.token.length}`);
      console.log(
        `   User: ${result.data.tenantUser.names} ${result.data.tenantUser.surname}`
      );
      return true;
    } else {
      console.error("❌ Login failed: No token received");
      return false;
    }
  } catch (error) {
    console.error("❌ Login test failed:", error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("🎯 CREATING VALID TEST CREDENTIALS");
  console.log("=====================================");

  // Step 1: Get admin token
  console.log("\n🔐 Step 1: Getting admin authentication token...");
  const adminToken = await getAdminToken();

  if (!adminToken) {
    console.error("❌ Failed to get admin token. Cannot proceed.");
    process.exit(1);
  }

  // Use the first tenant for testing
  const tenantId = "TNNT1755017739510";
  const tenantName = "Sample Area";

  try {
    // Create tenant admin
    const tenantAdmin = await createTenantAdmin(adminToken, tenantId);

    // Create tenant user
    const tenantUser = await createTenantUser(adminToken, tenantId);

    console.log("\n📋 CREDENTIAL SUMMARY");
    console.log("=====================");

    if (tenantAdmin) {
      console.log("\n🏢 TENANT ADMIN CREDENTIALS:");
      console.log(`   Tenant: ${tenantName}`);
      console.log(`   Email: sarah.admin@neighbourguard.co.za`);
      console.log(`   Password: TenantAdminPass123!`);

      // Test tenant admin login
      await testTenantAdminLogin(
        tenantName,
        "sarah.admin@neighbourguard.co.za",
        "TenantAdminPass123!"
      );
    }

    if (tenantUser) {
      console.log("\n👤 TENANT USER CREDENTIALS:");
      console.log(`   Tenant: ${tenantName}`);
      console.log(`   Name: John Smith`);
      console.log(`   Phone: +27123456789`);
      console.log(`   PIN: 1234`);

      // Test tenant user login
      await testTenantUserLogin(tenantName, "+27123456789", "1234");
    }

    console.log("\n✅ CREDENTIAL CREATION COMPLETE!");
    console.log("\n🌐 You can now test these credentials at:");
    console.log("   http://localhost:5000");
    console.log("\n🔧 Login Instructions:");
    console.log("   🏢 Tenant Admin: Click icon, use email + password");
    console.log("   👤 Tenant User: Click icon, use phone + PIN");
    console.log("\n📱 Test Credentials:");
    console.log(
      "   Tenant Admin: sarah.admin@neighbourguard.co.za / TenantAdminPass123!"
    );
    console.log("   Tenant User: +27123456789 / 1234");
  } catch (error) {
    console.error("❌ Failed to create credentials:", error.message);
    process.exit(1);
  }
}

main();
