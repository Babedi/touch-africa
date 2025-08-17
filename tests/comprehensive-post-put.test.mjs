import fs from "fs";
import { URL } from "url";
import http from "http";

const TOKEN_FILE = "token.txt";
const BASE_URL = "http://localhost:5000";
const TENANT_ID = "TNNT1754948681320"; // Existing tenant

// Utility to make HTTP requests
async function makeRequest(url, method = "GET", body = null, headers = {}) {
  return new Promise((resolve) => {
    try {
      const token = fs.readFileSync(TOKEN_FILE, "utf8").trim();
      const urlObj = new URL(url);

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-tenant-id": TENANT_ID,
          ...headers,
        },
      };

      const req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const jsonData = data ? JSON.parse(data) : null;
            resolve({
              status: res.statusCode,
              data: jsonData,
              success: res.statusCode >= 200 && res.statusCode < 300,
              raw: data,
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              data: data,
              success: res.statusCode >= 200 && res.statusCode < 300,
              raw: data,
            });
          }
        });
      });

      req.on("error", (error) => {
        resolve({ error: error.message, success: false });
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    } catch (error) {
      resolve({ error: error.message, success: false });
    }
  });
}

// Test result tracker
const results = [];
let totalTests = 0;
let passedTests = 0;

function logTest(module, action, result) {
  totalTests++;
  const status = result.success ? "PASS" : "FAIL";
  const message = `${status} ${module} ${action} (${result.status})`;

  if (result.success) {
    passedTests++;
    console.log(`✅ ${message}`);
  } else {
    console.log(`❌ ${message}`);
    if (result.error) console.log(`   Error: ${result.error}`);
    if (result.raw && result.raw.length < 200)
      console.log(`   Response: ${result.raw}`);
  }

  results.push({
    module,
    action,
    status: result.status,
    success: result.success,
    data: result.data,
  });
}

// Payload generators
function generateAlarmPayload() {
  return {
    serialNumber: `SN${Date.now()}`,
    sgmModuleType: "RTU5024",
    modelDescription: "Security Control Panel - Commercial Grade",
    accessDetails: {
      phoneNumber: "+27118765432",
      pin: "5678",
    },
  };
}

function generateResponderPayload() {
  return {
    type: "security",
    channel: "sms",
    contactPersonName: `Responder ${Date.now()}`,
    contactPersonPhone: "+27118765432",
    contactPersonEmail: `responder${Date.now()}@example.com`,
    responseTimeMinutes: 15,
  };
}

function generateTenantUserPayload() {
  return {
    title: "Mr",
    names: "Michael James",
    surname: "Thompson",
    subAddress: {
      streetOrFloor: "123 Sandton Central Drive",
      unit: `${Date.now() % 1000}`,
    },
    activationDetails: {
      phoneNumber: "+27845678901",
      pin: "1357",
      preferredMenuLanguage: "english",
      isATester: false,
    },
    account: {
      isActive: {
        value: true,
        changes: [],
      },
    },
  };
}

function generatePrivateResponderPayload() {
  return {
    title: "Mr",
    names: "Private Responder",
    surname: "Contact",
    subAddress: {
      streetOrFloor: "456 Private Street",
      unit: `${Date.now() % 1000}`,
    },
    activationDetails: {
      phoneNumber: "+27845678902",
      pin: "2468",
      preferredMenuLanguage: "english",
      isATester: false,
    },
    account: {
      isActive: { value: true, changes: [] },
    },
  };
}

function generateTenantPayload() {
  return {
    address: {
      country: "South Africa",
      province: "Gauteng",
      postalCode: "2010",
      locality: "Sandton",
    },
    activationResponseBlockName: "Test Tenant Response Block",
    activationContextMenu: {
      english: {
        menuItem1: "Life@Risk",
        menuItem2: "Property@Risk",
        menuItem3: "Both@Risk",
        menuItem4: "",
        menuItem5: "",
      },
    },
    ussdRefId: Math.floor(Math.random() * 1000),
  };
}

function generateAdminPayload() {
  return {
    username: `admin${Date.now()}`,
    email: `admin${Date.now()}@example.com`,
    password: "SecurePassword123",
    roles: ["internalSuperAdmin"],
  };
}

function generateServiceRequestPayload() {
  return {
    title: `Service Request ${Date.now()}`,
    description: "Test service request for comprehensive testing",
    priority: "medium",
    category: "technical",
    requestedBy: "test-user",
  };
}

// Test modules
async function testInternalAdmin() {
  console.log("\n=== Testing Internal Admin ===");

  // POST /internal/admin
  const createPayload = generateAdminPayload();
  const createResult = await makeRequest(
    `${BASE_URL}/internal/admin`,
    "POST",
    createPayload
  );
  logTest("InternalAdmin", "CREATE", createResult);

  if (createResult.success) {
    const adminId = createResult.data?.data?.id;

    // PUT /internal/admin/:id
    const updatePayload = { email: `updated${Date.now()}@example.com` };
    const updateResult = await makeRequest(
      `${BASE_URL}/internal/admin/${adminId}`,
      "PUT",
      updatePayload
    );
    logTest("InternalAdmin", "UPDATE", updateResult);
  }
}

async function testServiceRequest() {
  console.log("\n=== Testing Service Request ===");

  // POST /internal/serviceRequest
  const createPayload = generateServiceRequestPayload();
  const createResult = await makeRequest(
    `${BASE_URL}/internal/serviceRequest`,
    "POST",
    createPayload
  );
  logTest("ServiceRequest", "CREATE", createResult);

  if (createResult.success) {
    const requestId = createResult.data?.data?.id;

    // PUT /internal/serviceRequest/:id
    const updatePayload = { status: "in-progress" };
    const updateResult = await makeRequest(
      `${BASE_URL}/internal/serviceRequest/${requestId}`,
      "PUT",
      updatePayload
    );
    logTest("ServiceRequest", "UPDATE", updateResult);
  }
}

async function testServiceInfo() {
  console.log("\n=== Testing Service Info ===");

  // PUT /general/serviceInfo
  const serviceInfoPayload = {
    version: "01.000.0003",
    taglines: ["Updated tagline for testing"],
    lookups: {
      titlePrefixes: ["Mr", "Mrs", "Ms", "Dr"],
      languages: ["english", "afrikaans", "zulu"],
      gsmModuleTypes: ["RTU5024", "RTU6048"],
      responderTypes: ["security", "medical", "fire"],
      responderChannels: ["sms", "call", "email"],
    },
  };
  const updateResult = await makeRequest(
    `${BASE_URL}/general/serviceInfo`,
    "PUT",
    serviceInfoPayload
  );
  logTest("ServiceInfo", "UPDATE", updateResult);
}

async function testTenant() {
  console.log("\n=== Testing Tenant ===");

  // POST /external/tenant
  const createPayload = generateTenantPayload();
  const createResult = await makeRequest(
    `${BASE_URL}/external/tenant`,
    "POST",
    createPayload
  );
  logTest("Tenant", "CREATE", createResult);

  if (createResult.success) {
    const tenantId = createResult.data?.data?.id;

    // PUT /external/tenant/:id
    const updatePayload = {
      activationResponseBlockName: "Updated Response Block",
    };
    const updateResult = await makeRequest(
      `${BASE_URL}/external/tenant/${tenantId}`,
      "PUT",
      updatePayload
    );
    logTest("Tenant", "UPDATE", updateResult);

    // PUT /external/tenant/activate/:id
    const activateResult = await makeRequest(
      `${BASE_URL}/external/tenant/activate/${tenantId}`,
      "PUT"
    );
    logTest("Tenant", "ACTIVATE", activateResult);

    // PUT /external/tenant/deactivate/:id
    const deactivateResult = await makeRequest(
      `${BASE_URL}/external/tenant/deactivate/${tenantId}`,
      "PUT"
    );
    logTest("Tenant", "DEACTIVATE", deactivateResult);
  }
}

async function testTenantAdmin() {
  console.log("\n=== Testing Tenant Admin ===");

  // POST /external/tenantAdmin
  const createPayload = generateAdminPayload();
  const createResult = await makeRequest(
    `${BASE_URL}/external/tenantAdmin`,
    "POST",
    createPayload
  );
  logTest("TenantAdmin", "CREATE", createResult);

  if (createResult.success) {
    const adminId = createResult.data?.data?.id;

    // PUT /external/tenantAdmin/:id
    const updatePayload = { email: `tenant_updated${Date.now()}@example.com` };
    const updateResult = await makeRequest(
      `${BASE_URL}/external/tenantAdmin/${adminId}`,
      "PUT",
      updatePayload
    );
    logTest("TenantAdmin", "UPDATE", updateResult);
  }
}

async function testExternalAlarmList() {
  console.log("\n=== Testing External Alarm List ===");

  // POST /external/tenantExternalAlarmList
  const createPayload = generateAlarmPayload();
  const createResult = await makeRequest(
    `${BASE_URL}/external/tenantExternalAlarmList`,
    "POST",
    createPayload
  );
  logTest("ExternalAlarmList", "CREATE", createResult);

  if (createResult.success) {
    const alarmId = createResult.data?.data?.id;

    // PUT /external/tenantExternalAlarmList/:id
    const updatePayload = { modelDescription: "Updated External Alarm" };
    const updateResult = await makeRequest(
      `${BASE_URL}/external/tenantExternalAlarmList/${alarmId}`,
      "PUT",
      updatePayload
    );
    logTest("ExternalAlarmList", "UPDATE", updateResult);
  }
}

async function testInternalAlarmList() {
  console.log("\n=== Testing Internal Alarm List ===");

  // POST /external/tenantInternalAlarmList
  const createPayload = generateAlarmPayload();
  const createResult = await makeRequest(
    `${BASE_URL}/external/tenantInternalAlarmList`,
    "POST",
    createPayload
  );
  logTest("InternalAlarmList", "CREATE", createResult);

  if (createResult.success) {
    const alarmId = createResult.data?.data?.id;

    // PUT /external/tenantInternalAlarmList/:id
    const updatePayload = { modelDescription: "Updated Internal Alarm" };
    const updateResult = await makeRequest(
      `${BASE_URL}/external/tenantInternalAlarmList/${alarmId}`,
      "PUT",
      updatePayload
    );
    logTest("InternalAlarmList", "UPDATE", updateResult);
  }
}

async function testExternalResponderList() {
  console.log("\n=== Testing External Responder List ===");

  // POST /external/tenantExternalResponderList
  const createPayload = generateResponderPayload();
  const createResult = await makeRequest(
    `${BASE_URL}/external/tenantExternalResponderList`,
    "POST",
    createPayload
  );
  logTest("ExternalResponderList", "CREATE", createResult);

  if (createResult.success) {
    const responderId = createResult.data?.data?.id;

    // PUT /external/tenantExternalResponderList/:id
    const updatePayload = { contactPersonName: "Updated External Responder" };
    const updateResult = await makeRequest(
      `${BASE_URL}/external/tenantExternalResponderList/${responderId}`,
      "PUT",
      updatePayload
    );
    logTest("ExternalResponderList", "UPDATE", updateResult);

    // PUT /external/tenantExternalResponderList/activate/:id
    const activateResult = await makeRequest(
      `${BASE_URL}/external/tenantExternalResponderList/activate/${responderId}`,
      "PUT"
    );
    logTest("ExternalResponderList", "ACTIVATE", activateResult);

    // PUT /external/tenantExternalResponderList/deactivate/:id
    const deactivateResult = await makeRequest(
      `${BASE_URL}/external/tenantExternalResponderList/deactivate/${responderId}`,
      "PUT"
    );
    logTest("ExternalResponderList", "DEACTIVATE", deactivateResult);
  }
}

async function testInternalResponderList() {
  console.log("\n=== Testing Internal Responder List ===");

  // POST /external/tenantInternalResponderList
  const createPayload = generateResponderPayload();
  const createResult = await makeRequest(
    `${BASE_URL}/external/tenantInternalResponderList`,
    "POST",
    createPayload
  );
  logTest("InternalResponderList", "CREATE", createResult);

  if (createResult.success) {
    const responderId = createResult.data?.data?.id;

    // PUT /external/tenantInternalResponderList/:id
    const updatePayload = { contactPersonName: "Updated Internal Responder" };
    const updateResult = await makeRequest(
      `${BASE_URL}/external/tenantInternalResponderList/${responderId}`,
      "PUT",
      updatePayload
    );
    logTest("InternalResponderList", "UPDATE", updateResult);

    // PUT /external/tenantInternalResponderList/activate/:id
    const activateResult = await makeRequest(
      `${BASE_URL}/external/tenantInternalResponderList/activate/${responderId}`,
      "PUT"
    );
    logTest("InternalResponderList", "ACTIVATE", activateResult);

    // PUT /external/tenantInternalResponderList/deactivate/:id
    const deactivateResult = await makeRequest(
      `${BASE_URL}/external/tenantInternalResponderList/deactivate/${responderId}`,
      "PUT"
    );
    logTest("InternalResponderList", "DEACTIVATE", deactivateResult);
  }
}

async function testTenantUser() {
  console.log("\n=== Testing Tenant User ===");

  // POST /external/tenantUser
  const createPayload = generateTenantUserPayload();
  const createResult = await makeRequest(
    `${BASE_URL}/external/tenantUser`,
    "POST",
    createPayload
  );
  logTest("TenantUser", "CREATE", createResult);

  if (createResult.success) {
    const userId = createResult.data?.data?.id;

    // PUT /external/tenantUser/:id
    const updatePayload = { names: "Updated User Name" };
    const updateResult = await makeRequest(
      `${BASE_URL}/external/tenantUser/${userId}`,
      "PUT",
      updatePayload
    );
    logTest("TenantUser", "UPDATE", updateResult);

    // PUT /external/tenantUser/activate/:id
    const activateResult = await makeRequest(
      `${BASE_URL}/external/tenantUser/activate/${userId}`,
      "PUT"
    );
    logTest("TenantUser", "ACTIVATE", activateResult);

    // PUT /external/tenantUser/deactivate/:id
    const deactivateResult = await makeRequest(
      `${BASE_URL}/external/tenantUser/deactivate/${userId}`,
      "PUT"
    );
    logTest("TenantUser", "DEACTIVATE", deactivateResult);

    return userId; // Return for private responder testing
  }
  return null;
}

async function testPrivateResponders(userId) {
  console.log("\n=== Testing Private Responders ===");

  if (!userId) {
    console.log("⚠️  Skipping private responders test - no valid user ID");
    return;
  }

  // POST /external/privateResponders
  const createPayload = generatePrivateResponderPayload();
  const createResult = await makeRequest(
    `${BASE_URL}/external/privateResponders?userId=${userId}`,
    "POST",
    createPayload
  );
  logTest("PrivateResponders", "CREATE", createResult);

  if (createResult.success) {
    const responderId = createResult.data?.data?.id;

    // PUT /external/privateResponders/:id
    const updatePayload = { names: "Updated Private Responder" };
    const updateResult = await makeRequest(
      `${BASE_URL}/external/privateResponders/${responderId}?userId=${userId}`,
      "PUT",
      updatePayload
    );
    logTest("PrivateResponders", "UPDATE", updateResult);
  }
}

async function testInternalAlarmMenus() {
  console.log("\n=== Testing Internal Alarm Menus ===");

  // First create some alarms for the menu
  const alarm1 = await makeRequest(
    `${BASE_URL}/external/tenantInternalAlarmList`,
    "POST",
    generateAlarmPayload()
  );
  const alarm2 = await makeRequest(
    `${BASE_URL}/external/tenantInternalAlarmList`,
    "POST",
    generateAlarmPayload()
  );

  if (alarm1.success && alarm2.success) {
    const alarmIds = [alarm1.data.data.id, alarm2.data.data.id];

    // PUT /external/tenantInternalAlarm/internalAlarmsMenuItem1
    const menuPayload = { internalAlarmsMenuItem1: alarmIds };
    const menuResult = await makeRequest(
      `${BASE_URL}/external/tenantInternalAlarm/internalAlarmsMenuItem1`,
      "PUT",
      menuPayload
    );
    logTest("InternalAlarmMenu", "UPDATE_MENU_ITEM_1", menuResult);

    // PUT /external/tenantInternalAlarm/internalAlarmsMenuItem2
    const menu2Payload = { internalAlarmsMenuItem2: [alarmIds[0]] };
    const menu2Result = await makeRequest(
      `${BASE_URL}/external/tenantInternalAlarm/internalAlarmsMenuItem2`,
      "PUT",
      menu2Payload
    );
    logTest("InternalAlarmMenu", "UPDATE_MENU_ITEM_2", menu2Result);
  }
}

async function testInternalResponderMenus() {
  console.log("\n=== Testing Internal Responder Menus ===");

  // First create some responders for the menu
  const responder1 = await makeRequest(
    `${BASE_URL}/external/tenantInternalResponderList`,
    "POST",
    generateResponderPayload()
  );
  const responder2 = await makeRequest(
    `${BASE_URL}/external/tenantInternalResponderList`,
    "POST",
    generateResponderPayload()
  );

  if (responder1.success && responder2.success) {
    const responderIds = [responder1.data.data.id, responder2.data.data.id];

    // PUT /external/tenantInternalResponder/menu/internalRespondersMenuItem1
    const menuPayload = { responderIds };
    const menuResult = await makeRequest(
      `${BASE_URL}/external/tenantInternalResponder/menu/internalRespondersMenuItem1`,
      "PUT",
      menuPayload
    );
    logTest("InternalResponderMenu", "UPDATE_MENU_ITEM_1", menuResult);
  }
}

async function testExternalResponderMenus() {
  console.log("\n=== Testing External Responder Menus ===");

  // First create some responders for the menu
  const responder1 = await makeRequest(
    `${BASE_URL}/external/tenantExternalResponderList`,
    "POST",
    generateResponderPayload()
  );
  const responder2 = await makeRequest(
    `${BASE_URL}/external/tenantExternalResponderList`,
    "POST",
    generateResponderPayload()
  );

  if (responder1.success && responder2.success) {
    const responderIds = [responder1.data.data.id, responder2.data.data.id];

    // PUT /external/tenantExternalResponder/menu/externalRespondersMenuItem1
    const menuPayload = { responderIds };
    const menuResult = await makeRequest(
      `${BASE_URL}/external/tenantExternalResponder/menu/externalRespondersMenuItem1`,
      "PUT",
      menuPayload
    );
    logTest("ExternalResponderMenu", "UPDATE_MENU_ITEM_1", menuResult);
  }
}

// Main test runner
async function runComprehensiveTests() {
  console.log("🚀 Starting Comprehensive POST/PUT Route Tests");
  console.log(`Using tenant ID: ${TENANT_ID}`);
  console.log("=" * 60);

  try {
    // Test core modules first
    await testServiceInfo(); // This provides lookups for other modules

    // Test admin and service modules
    await testInternalAdmin();
    await testServiceRequest();

    // Test tenant and tenant admin
    await testTenant();
    await testTenantAdmin();

    // Test alarm lists
    await testExternalAlarmList();
    await testInternalAlarmList();

    // Test responder lists
    await testExternalResponderList();
    await testInternalResponderList();

    // Test tenant user and private responders
    const userId = await testTenantUser();
    await testPrivateResponders(userId);

    // Test menu systems
    await testInternalAlarmMenus();
    await testInternalResponderMenus();
    await testExternalResponderMenus();
  } catch (error) {
    console.error("❌ Test execution error:", error);
  }

  // Summary
  console.log("\n" + "=" * 60);
  console.log("📊 TEST SUMMARY");
  console.log("=" * 60);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(
    `Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`
  );

  if (passedTests === totalTests) {
    console.log("🎉 All tests passed!");
  } else {
    console.log("⚠️  Some tests failed. Review the output above for details.");
  }

  // Save detailed results
  fs.writeFileSync(
    "test-results.json",
    JSON.stringify(
      {
        summary: {
          total: totalTests,
          passed: passedTests,
          failed: totalTests - passedTests,
          successRate: (passedTests / totalTests) * 100,
        },
        results: results,
      },
      null,
      2
    )
  );

  console.log("\n📝 Detailed results saved to test-results.json");
}

// Run the tests
runComprehensiveTests().catch(console.error);
