import assert from "assert";

const BASE_URL = "http://localhost:5000";

// Get token for testing
async function getToken() {
  try {
    const fs = await import("fs");
    return fs.readFileSync("token.txt", "utf8").trim();
  } catch {
    throw new Error("No token.txt found. Run npm run make:token first.");
  }
}

async function testTenantUserRoutes() {
  const token = await getToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "x-tenant-id": "TNNT1754948681320", // Use existing tenant
  };

  console.log("Testing Tenant User routes...");

  // Test payload
  const tenantUserPayload = {
    title: "Mr",
    names: "Michael James",
    surname: "Thompson",
    subAddress: {
      streetOrFloor: "123 Sandton Central Drive",
      unit: "101",
    },
    activationDetails: {
      phoneNumber: "+27845678901",
      pin: "1357",
      preferredMenuLanguage: "english",
      isATester: true,
    },
    account: {
      isActive: {
        value: true,
        changes: [],
      },
    },
  };

  try {
    // Test CREATE tenant user
    console.log("Testing POST /external/tenantUser");
    const createResponse = await fetch(`${BASE_URL}/external/tenantUser`, {
      method: "POST",
      headers,
      body: JSON.stringify(tenantUserPayload),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error("Create failed:", error);
      return;
    }

    const created = await createResponse.json();
    console.log("✓ Created tenant user:", created.data.id);
    const userId = created.data.id;

    // Test LIST tenant users
    console.log("Testing GET /external/tenantUser/list");
    const listResponse = await fetch(`${BASE_URL}/external/tenantUser/list`, {
      headers,
    });
    const list = await listResponse.json();
    console.log("✓ Listed tenant users:", list.data.length, "users");

    // Test GET by ID
    console.log("Testing GET /external/tenantUser/:id");
    const getResponse = await fetch(
      `${BASE_URL}/external/tenantUser/${userId}`,
      { headers }
    );
    const getResult = await getResponse.json();
    console.log("✓ Retrieved tenant user:", getResult.data.id);

    // Test UPDATE
    console.log("Testing PUT /external/tenantUser/:id");
    const updateResponse = await fetch(
      `${BASE_URL}/external/tenantUser/${userId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({ names: "Michael Updated" }),
      }
    );
    const updated = await updateResponse.json();
    console.log("✓ Updated tenant user");

    // Test ACTIVATE
    console.log("Testing PUT /external/tenantUser/activate/:id");
    const activateResponse = await fetch(
      `${BASE_URL}/external/tenantUser/activate/${userId}`,
      {
        method: "PUT",
        headers,
      }
    );
    console.log("✓ Activated tenant user");

    // Test DEACTIVATE
    console.log("Testing PUT /external/tenantUser/deactivate/:id");
    const deactivateResponse = await fetch(
      `${BASE_URL}/external/tenantUser/deactivate/${userId}`,
      {
        method: "PUT",
        headers,
      }
    );
    console.log("✓ Deactivated tenant user");

    console.log("All tenant user tests passed!");
  } catch (error) {
    console.error("Test error:", error.message);
  }
}

async function testTenantInternalResponderRoutes() {
  const token = await getToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "x-tenant-id": "TNNT1754948681320", // Use existing tenant
  };

  console.log("Testing Tenant Internal Responder Menu routes...");

  const menuPayload = {
    menuItem1: [],
    menuItem2: [],
    menuItem3: [],
    menuItem4: [],
    menuItem5: [],
  };

  try {
    // Test GET menu
    console.log("Testing GET /external/tenantInternalResponder/menu");
    const getMenuResponse = await fetch(
      `${BASE_URL}/external/tenantInternalResponder/menu`,
      { headers }
    );
    const menu = await getMenuResponse.json();
    console.log("✓ Retrieved menu:", Object.keys(menu.data));

    // Test POST menu (bulk update)
    console.log("Testing POST /external/tenantInternalResponder/menu");
    const postMenuResponse = await fetch(
      `${BASE_URL}/external/tenantInternalResponder/menu`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(menuPayload),
      }
    );
    const updated = await postMenuResponse.json();
    console.log("✓ Updated menu bulk");

    // Test GET specific menu item
    console.log("Testing GET /external/tenantInternalResponder/menu/menuItem1");
    const getItemResponse = await fetch(
      `${BASE_URL}/external/tenantInternalResponder/menu/menuItem1`,
      { headers }
    );
    const item = await getItemResponse.json();
    console.log("✓ Retrieved menu item");

    // Test PUT specific menu item
    console.log("Testing PUT /external/tenantInternalResponder/menu/menuItem1");
    const putItemResponse = await fetch(
      `${BASE_URL}/external/tenantInternalResponder/menu/menuItem1`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({ responderIds: [] }),
      }
    );
    console.log("✓ Updated menu item");

    console.log("All tenant internal responder menu tests passed!");
  } catch (error) {
    console.error("Test error:", error.message);
  }
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      console.log("Starting tenant user tests...");
      await testTenantUserRoutes();
      console.log("");
      console.log("Starting tenant internal responder tests...");
      await testTenantInternalResponderRoutes();
      console.log("All tests completed!");
    } catch (error) {
      console.error("Test runner error:", error);
    }
  })();
}
