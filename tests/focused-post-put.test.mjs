import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

const TOKEN_FILE = join(rootDir, "token.txt");
const BASE_URL = "http://localhost:5000";
const TENANT_ID = "TNNT1754948681320";

// Get token - ensure it exists
function getToken() {
  try {
    if (!fs.existsSync(TOKEN_FILE)) {
      console.error("❌ Token file not found. Please run: npm run make:token");
      process.exit(1);
    }
    return fs.readFileSync(TOKEN_FILE, "utf8").trim();
  } catch (error) {
    console.error("❌ Error reading token:", error.message);
    process.exit(1);
  }
}

// HTTP request utility
async function makeRequest(
  url,
  method = "GET",
  body = null,
  extraHeaders = {}
) {
  const token = getToken();

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "x-tenant-id": TENANT_ID,
    ...extraHeaders,
  };

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : null;
    } catch {
      data = await response.text();
    }

    return {
      status: response.status,
      success: response.ok,
      data,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message,
    };
  }
}

// Test result tracking
let totalTests = 0;
let passedTests = 0;
const results = [];

function logTest(module, action, result) {
  totalTests++;
  const status = result.success ? "PASS" : "FAIL";

  if (result.success) {
    passedTests++;
    console.log(`✅ ${status} ${module} ${action} (${result.status})`);
  } else {
    console.log(`❌ ${status} ${module} ${action} (${result.status})`);
    if (result.error) console.log(`   Error: ${result.error}`);
  }

  results.push({
    module,
    action,
    status: result.status,
    success: result.success,
    data: result.data,
  });
}

// Test payloads
function generateTenantUserPayload() {
  return {
    title: "Mr",
    names: "John",
    surname: "Doe",
    subAddress: {
      streetOrFloor: "123 Test Street",
      unit: `${Date.now() % 1000}`,
    },
    activationDetails: {
      phoneNumber: "+27845678901",
      pin: "1234",
      preferredMenuLanguage: "english",
      isATester: false,
    },
  };
}

function generateAlarmPayload() {
  return {
    serialNumber: `SN${Date.now()}`,
    sgmModuleType: "RTU5024",
    modelDescription: "Security Control Panel - Test",
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

// Core tests
async function testTenantUser() {
  console.log("\n🧪 Testing Tenant User Routes");

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
    const updatePayload = { names: "Updated Name" };
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

    return userId;
  }
  return null;
}

async function testExternalAlarmList() {
  console.log("\n🚨 Testing External Alarm List Routes");

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
    const updatePayload = {
      modelDescription: "Updated External Alarm Description",
    };
    const updateResult = await makeRequest(
      `${BASE_URL}/external/tenantExternalAlarmList/${alarmId}`,
      "PUT",
      updatePayload
    );
    logTest("ExternalAlarmList", "UPDATE", updateResult);

    return alarmId;
  }
  return null;
}

async function testInternalAlarmList() {
  console.log("\n🚨 Testing Internal Alarm List Routes");

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
    const updatePayload = {
      modelDescription: "Updated Internal Alarm Description",
    };
    const updateResult = await makeRequest(
      `${BASE_URL}/external/tenantInternalAlarmList/${alarmId}`,
      "PUT",
      updatePayload
    );
    logTest("InternalAlarmList", "UPDATE", updateResult);

    return alarmId;
  }
  return null;
}

async function testExternalResponderList() {
  console.log("\n👥 Testing External Responder List Routes");

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

    return responderId;
  }
  return null;
}

async function testInternalResponderList() {
  console.log("\n👥 Testing Internal Responder List Routes");

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

    return responderId;
  }
  return null;
}

async function testPrivateResponders(userId) {
  if (!userId) {
    console.log("\n⚠️  Skipping Private Responders - no valid user ID");
    return;
  }

  console.log("\n🔐 Testing Private Responders Routes");

  // POST /external/privateResponders
  const createPayload = {
    title: "Ms",
    names: "Private",
    surname: "Responder",
    subAddress: {
      streetOrFloor: "456 Private Street",
      unit: `${Date.now() % 100}`,
    },
    activationDetails: {
      phoneNumber: "+27845678902",
      pin: "2468",
      preferredMenuLanguage: "english",
      isATester: false,
    },
  };

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
  console.log("\n📋 Testing Internal Alarm Menu Routes");

  // Create some alarms first
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
  }
}

// Main test execution
async function runFocusedTests() {
  console.log("🚀 Starting Focused POST/PUT Route Tests");
  console.log(`📍 Using tenant: ${TENANT_ID}`);
  console.log(`🔑 Token file: ${TOKEN_FILE}`);
  console.log("=" + "=".repeat(50));

  try {
    // Test main CRUD operations
    const userId = await testTenantUser();
    const externalAlarmId = await testExternalAlarmList();
    const internalAlarmId = await testInternalAlarmList();
    const externalResponderId = await testExternalResponderList();
    const internalResponderId = await testInternalResponderList();

    // Test dependent operations
    await testPrivateResponders(userId);
    await testInternalAlarmMenus();
  } catch (error) {
    console.error("❌ Test execution error:", error);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(
    `Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`
  );

  if (passedTests === totalTests) {
    console.log("🎉 All tests passed!");
  } else {
    console.log("⚠️  Some tests failed.");
    console.log("\n📝 Failed Tests:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   - ${r.module} ${r.action} (${r.status})`);
      });
  }

  // Save results
  const resultData = {
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      successRate: (passedTests / totalTests) * 100,
      timestamp: new Date().toISOString(),
    },
    results: results,
  };

  const resultsFile = join(rootDir, "focused-test-results.json");
  fs.writeFileSync(resultsFile, JSON.stringify(resultData, null, 2));
  console.log(`\n📄 Results saved to: ${resultsFile}`);
}

// Run the tests
runFocusedTests().catch(console.error);
