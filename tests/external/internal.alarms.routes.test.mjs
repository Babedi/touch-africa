import fs from "fs";

const TOKEN_FILE = "token.txt";
const BASE_URL = "http://localhost:5000";
const SERVICE_ID = "neighbourGuardService";
const TENANT_ID = "TNNT1754948681320";

async function makeRequest(url, method = "GET", body = null) {
  try {
    const token = fs.readFileSync(TOKEN_FILE, "utf8").trim();

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    const data = await response.text();

    return {
      status: response.status,
      data: data ? JSON.parse(data) : null,
      success: response.ok,
    };
  } catch (error) {
    return { error: error.message, success: false };
  }
}

async function testInternalAlarmsE2E() {
  console.log("=== Internal Alarms E2E Test ===\n");

  const testResults = [];
  const menuItems = [1, 2, 3, 4, 5];

  for (const item of menuItems) {
    const menuItem = `internalAlarmsMenuItem${item}`;
    console.log(`Testing ${menuItem}...`);

    // Test GET list (should be empty initially)
    const getListUrl = `${BASE_URL}/services/${SERVICE_ID}/tenants/${TENANT_ID}/internalAlarms/${menuItem}/list`;
    const listResult = await makeRequest(getListUrl, "GET");
    testResults.push({
      test: `GET ${menuItem} list`,
      status: listResult.status,
      success: listResult.success,
    });

    // Test PUT with sample alarm ID
    const putPayload = { [menuItem]: ["ALARM1754951274742"] };
    const putUrl = `${BASE_URL}/services/${SERVICE_ID}/tenants/${TENANT_ID}/internalAlarms/${menuItem}`;
    const putResult = await makeRequest(putUrl, "PUT", putPayload);
    testResults.push({
      test: `PUT ${menuItem}`,
      status: putResult.status,
      success: putResult.success,
    });

    // Test GET specific alarm
    const getAlarmUrl = `${BASE_URL}/services/${SERVICE_ID}/tenants/${TENANT_ID}/internalAlarms/${menuItem}/ALARM1754951274742`;
    const alarmResult = await makeRequest(getAlarmUrl, "GET");
    testResults.push({
      test: `GET alarm from ${menuItem}`,
      status: alarmResult.status,
      success: alarmResult.success,
    });

    // Test DELETE alarm
    const deleteUrl = `${BASE_URL}/services/${SERVICE_ID}/tenants/${TENANT_ID}/internalAlarms/${menuItem}/ALARM1754951274742`;
    const deleteResult = await makeRequest(deleteUrl, "DELETE");
    testResults.push({
      test: `DELETE alarm from ${menuItem}`,
      status: deleteResult.status,
      success: deleteResult.success,
    });
  }

  // Test GET all alarms
  const getAllUrl = `${BASE_URL}/services/${SERVICE_ID}/tenants/${TENANT_ID}/internalAlarms/list`;
  const allResult = await makeRequest(getAllUrl, "GET");
  testResults.push({
    test: "GET all internal alarms",
    status: allResult.status,
    success: allResult.success,
  });

  // Print results
  console.log("\n=== Test Results ===");
  testResults.forEach((result) => {
    const status = result.success ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} ${result.test} (${result.status})`);
  });

  const passCount = testResults.filter((r) => r.success).length;
  console.log(`\nPassed: ${passCount}/${testResults.length}`);
}

testInternalAlarmsE2E().catch(console.error);
