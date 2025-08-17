#!/usr/bin/env node

import fetch from "node-fetch";
import fs from "fs";

const BASE_URL = "http://localhost:5000";

console.log("🏠 CREATING TENANT CREDENTIALS FOR TESTING\n");

// Read the admin token
const token = fs.readFileSync("token.txt", "utf8").trim();
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

// First, let's get existing tenants
async function getTenants() {
  console.log("📋 Step 1: Getting available tenants...");
  try {
    const response = await fetch(`${BASE_URL}/external/tenant/list`, {
      headers,
    });
    const data = await response.json();

    if (data.success) {
      console.log(`✅ Found ${data.data.length} tenants:`);
      data.data.forEach((tenant, index) => {
        console.log(
          `   ${index + 1}. ${tenant.id} - ${tenant.address.locality}`
        );
      });
      return data.data;
    } else {
      throw new Error("Failed to get tenants");
    }
  } catch (error) {
    console.error("❌ Error getting tenants:", error.message);
    return [];
  }
}

// Create a new tenant specifically for testing credentials
async function createTestTenant() {
  console.log("\n📋 Step 2: Creating a test tenant for credentials...");

  const tenantData = {
    id: `TNNT_CRED_TEST_${Date.now()}`,
    address: {
      country: "South Africa",
      province: "Gauteng",
      locality: "Credential Test Area",
      postalCode: "2001",
    },
    activationResponseBlockName: `Credential Test Block ${Date.now()}`,
    activationContextMenu: {
      english: {
        menuItem1: "Life@Risk",
        menuItem2: "Property@Risk",
        menuItem3: "Both@Risk",
        menuItem4: "",
        menuItem5: "",
      },
    },
    ussdRefId: 999,
    // Add tenant admin credentials during creation
    tenantAdmin: {
      title: "Mr",
      names: "Admin",
      surname: "Manager",
      accessDetails: {
        email: "admin@credtest.neighbourguard.co.za",
        password: "TenantAdmin123!",
      },
      account: {
        isActive: {
          value: true,
          changes: [],
        },
      },
    },
  };

  try {
    const response = await fetch(`${BASE_URL}/external/tenant`, {
      method: "POST",
      headers,
      body: JSON.stringify(tenantData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log("✅ Test tenant created successfully:");
      console.log(`   Tenant ID: ${result.data.id}`);
      console.log(`   Locality: ${result.data.address.locality}`);
      return result.data;
    } else {
      throw new Error(result.message || `HTTP ${response.status}`);
    }
  } catch (error) {
    console.error("❌ Error creating test tenant:", error.message);
    return null;
  }
}

// Create tenant admin for an existing tenant
async function createTenantAdmin(tenantId) {
  console.log(`\n📋 Step 3: Creating Tenant Admin for ${tenantId}...`);

  const adminData = {
    roles: ["externalSuperAdmin"],
    title: "Ms",
    names: "Sarah",
    surname: "TenantAdmin",
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
    // Note: Correct endpoint pattern is /external/tenantAdmin/:tenantId
    const response = await fetch(
      `${BASE_URL}/external/tenantAdmin/${tenantId}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(adminData),
      }
    );

    const result = await response.json();

    if (response.ok && result.success) {
      console.log("✅ Tenant Admin created successfully:");
      console.log(`   Admin ID: ${result.data.id}`);
      console.log(`   Email: ${result.data.accessDetails.email}`);
      console.log(`   Password: TenantAdminPass123!`);
      return result.data;
    } else {
      throw new Error(result.message || `HTTP ${response.status}`);
    }
  } catch (error) {
    console.error("❌ Error creating tenant admin:", error.message);
    return null;
  }
}

// Create tenant users
async function createTenantUsers(tenantId) {
  console.log(`\n📋 Step 4: Creating Tenant Users for ${tenantId}...`);

  const users = [
    {
      title: "Mr",
      names: "John",
      surname: "Smith",
      subAddress: {
        streetOrFloor: "123 Main Street",
        unit: "Apt 4A",
      },
      activationDetails: {
        phoneNumber: "+27123456789",
        pin: "1234",
        preferredMenuLanguage: "English",
        isATester: false,
      },
    },
    {
      title: "Mrs",
      names: "Jane",
      surname: "Doe",
      subAddress: {
        streetOrFloor: "456 Oak Avenue",
        unit: "House 15",
      },
      activationDetails: {
        phoneNumber: "+27987654321",
        pin: "5678",
        preferredMenuLanguage: "English",
        isATester: false,
      },
    },
  ];

  const createdUsers = [];

  for (let i = 0; i < users.length; i++) {
    const userData = users[i];
    try {
      const response = await fetch(`${BASE_URL}/external/tenantUser`, {
        method: "POST",
        headers: {
          ...headers,
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log(`✅ Tenant User ${i + 1} created successfully:`);
        console.log(`   User ID: ${result.data.id}`);
        console.log(`   Name: ${result.data.names} ${result.data.surname}`);
        console.log(`   Phone: ${result.data.activationDetails.phoneNumber}`);
        console.log(`   PIN: ${result.data.activationDetails.pin}`);
        createdUsers.push(result.data);
      } else {
        throw new Error(result.message || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Error creating tenant user ${i + 1}:`, error.message);
    }
  }

  return createdUsers;
}

// Test tenant admin login
async function testTenantAdminLogin(tenantName, email, password) {
  console.log(`\n📋 Step 5: Testing Tenant Admin Login...`);

  const loginData = {
    tenantName,
    email,
    password,
  };

  try {
    const response = await fetch(`${BASE_URL}/external/tenantAdmin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log("✅ Tenant Admin Login successful:");
      console.log(`   Token length: ${result.data.token.length}`);
      console.log(
        `   Admin: ${result.data.admin.names} ${result.data.admin.surname}`
      );
      console.log(`   Tenant: ${result.data.tenant.id}`);
      return result.data.token;
    } else {
      throw new Error(result.message || `HTTP ${response.status}`);
    }
  } catch (error) {
    console.error("❌ Tenant Admin Login failed:", error.message);
    return null;
  }
}

// Test tenant user login
async function testTenantUserLogin(tenantName, username, password) {
  console.log(`\n📋 Step 6: Testing Tenant User Login...`);

  const loginData = {
    tenantName,
    username,
    password,
  };

  try {
    const response = await fetch(`${BASE_URL}/external/tenantUser/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log("✅ Tenant User Login successful:");
      console.log(`   Token length: ${result.data.token.length}`);
      console.log(`   User: ${result.data.user.username}`);
      console.log(`   Tenant: ${result.data.tenantId}`);
      return result.data.token;
    } else {
      throw new Error(result.message || `HTTP ${response.status}`);
    }
  } catch (error) {
    console.error("❌ Tenant User Login failed:", error.message);
    return null;
  }
}

// Generate credentials summary
function generateCredentialsSummary(tenant, admin, users) {
  console.log("\n🎯 CREDENTIALS SUMMARY FOR TESTING\n");
  console.log("=".repeat(60));

  console.log("\n🏢 TENANT INFORMATION:");
  console.log(`   Tenant ID: ${tenant.id}`);
  console.log(`   Tenant Name: ${tenant.address.locality}`);
  console.log(
    `   Location: ${tenant.address.locality}, ${tenant.address.province}`
  );

  if (admin) {
    console.log("\n👑 TENANT ADMIN CREDENTIALS:");
    console.log(`   Email: ${admin.accessDetails.email}`);
    console.log(`   Password: TenantAdminPass123!`);
    console.log(`   Name: ${admin.names} ${admin.surname}`);
    console.log("   Login URL: /external/tenantAdmin/login");
  }

  if (users && users.length > 0) {
    console.log("\n👤 TENANT USER CREDENTIALS:");
    console.log(
      "   📋 Note: Current login endpoint expects username/password format"
    );
    console.log(
      "   📋 For demo testing, use any username/password combination"
    );
    console.log(
      "   📋 Created users have phoneNumber/pin but login uses username/password"
    );
    console.log("");
    console.log("   Demo Login Credentials:");
    console.log("     Username: john.smith");
    console.log("     Password: password123");
    console.log("     (or any username/password combination)");
    console.log("");
    console.log("   Created User Data (for reference):");
    users.forEach((user, index) => {
      console.log(`     User ${index + 1}:`);
      console.log(`       Phone: ${user.activationDetails.phoneNumber}`);
      console.log(`       PIN: ${user.activationDetails.pin}`);
      console.log(`       Name: ${user.names} ${user.surname}`);
      console.log(
        `       Address: ${user.subAddress.streetOrFloor}, ${user.subAddress.unit}`
      );
    });
    console.log("   Login URL: /external/tenantUser/login");
  }

  console.log("\n🧪 FRONTEND TESTING:");
  console.log("   You can now test both tenant admin and tenant user login");
  console.log("   modals with these valid credentials!");
  console.log("\n" + "=".repeat(60));
}

// Main execution function
async function main() {
  try {
    // Get existing tenants
    const existingTenants = await getTenants();

    // Use the first existing tenant
    let targetTenant = existingTenants[0];

    if (!targetTenant) {
      // Create a new tenant if none exist
      targetTenant = await createTestTenant();
      if (!targetTenant) {
        throw new Error("Failed to create test tenant");
      }
    }

    console.log(
      `\n🎯 Using tenant: ${targetTenant.id} (${targetTenant.address.locality})`
    );

    // Create tenant admin
    const tenantAdmin = await createTenantAdmin(targetTenant.id);

    // Create tenant users
    const tenantUsers = await createTenantUsers(targetTenant.id);

    // Test logins if credentials were created successfully
    if (tenantAdmin) {
      await testTenantAdminLogin(
        targetTenant.address.locality,
        tenantAdmin.accessDetails.email,
        "TenantAdminPass123!"
      );
    }

    if (tenantUsers.length > 0) {
      // Test tenant user login with demo credentials (username/password format)
      await testTenantUserLogin(
        targetTenant.address.locality,
        "john.smith", // demo username based on user
        "password123" // demo password
      );
    }

    // Generate summary
    generateCredentialsSummary(targetTenant, tenantAdmin, tenantUsers);
  } catch (error) {
    console.error("\n❌ Script execution failed:", error.message);
    process.exit(1);
  }
}

// Run the script
main();
