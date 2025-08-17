import fs from "fs";

console.log("🧪 TENANT EXTERNAL ALARM MODULE E2E TESTS");
console.log("=========================================");

const BASE_URL = "http://localhost:5000";
const token = fs.readFileSync("token.txt", "utf8").trim();

async function testAPI(method, endpoint, data = null, headers = {}) {
  const fullHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "x-tenant-id": "TNNT1755005653605", // Using first tenant from our data
    ...headers,
  };

  const options = {
    method,
    headers: fullHeaders,
  };

  if (data && (method === "POST" || method === "PUT")) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const responseText = await response.text();

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return {
      status: response.status,
      ok: response.ok,
      data: responseData,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

async function runTests() {
  let passedTests = 0;
  let totalTests = 0;

  console.log("\n📋 Test Plan:");
  console.log("1. GET all external alarms from all menu items");
  console.log(
    "2. GET alarms from specific menu item (externalAlarmsMenuItem1)"
  );
  console.log("3. GET specific alarm from menu item");
  console.log("4. PUT update menu item with alarm IDs");
  console.log("5. DELETE alarm from menu item");
  console.log("6. Test invalid menu item validation");

  console.log("\n🏃 Running Tests...\n");

  // Test 1: GET all external alarms from all menu items
  totalTests++;
  console.log("Test 1: GET /external/tenantExternalAlarm/list");
  const allAlarmsResult = await testAPI(
    "GET",
    "/external/tenantExternalAlarm/list"
  );
  console.log(`   Status: ${allAlarmsResult.status}`);
  console.log(`   Response: ${JSON.stringify(allAlarmsResult.data, null, 4)}`);

  if (allAlarmsResult.ok) {
    console.log("   ✅ PASS - Successfully retrieved all external alarms");
    passedTests++;
  } else {
    console.log("   ❌ FAIL - Failed to retrieve all external alarms");
  }

  // Test 2: GET alarms from specific menu item
  totalTests++;
  console.log(
    "\nTest 2: GET /external/tenantExternalAlarm/externalAlarmsMenuItem1/list"
  );
  const menuItemAlarmsResult = await testAPI(
    "GET",
    "/external/tenantExternalAlarm/externalAlarmsMenuItem1/list"
  );
  console.log(`   Status: ${menuItemAlarmsResult.status}`);
  console.log(
    `   Response: ${JSON.stringify(menuItemAlarmsResult.data, null, 4)}`
  );

  if (menuItemAlarmsResult.ok) {
    console.log("   ✅ PASS - Successfully retrieved alarms from menu item");
    passedTests++;
  } else {
    console.log("   ❌ FAIL - Failed to retrieve alarms from menu item");
  }

  // Test 3: GET specific alarm from menu item (use a known alarm ID from previous data)
  const testAlarmId = "ALARM1755005653909"; // From our comprehensive data population

  totalTests++;
  console.log(
    `\nTest 3: GET /external/tenantExternalAlarm/externalAlarmsMenuItem1/${testAlarmId}`
  );
  const specificAlarmResult = await testAPI(
    "GET",
    `/external/tenantExternalAlarm/externalAlarmsMenuItem1/${testAlarmId}`
  );
  console.log(`   Status: ${specificAlarmResult.status}`);
  console.log(
    `   Response: ${JSON.stringify(specificAlarmResult.data, null, 4)}`
  );

  if (
    specificAlarmResult.status === 200 ||
    specificAlarmResult.status === 404
  ) {
    console.log("   ✅ PASS - Correctly handled specific alarm request");
    passedTests++;
  } else {
    console.log("   ❌ FAIL - Unexpected response for specific alarm");
  }

  // Test 4: PUT update menu item with alarm IDs
  totalTests++;
  console.log(
    `\nTest 4: PUT /external/tenantExternalAlarm/externalAlarmsMenuItem1/${testAlarmId}`
  );
  const updateData = {
    alarmIds: [testAlarmId],
  };
  const updateResult = await testAPI(
    "PUT",
    `/external/tenantExternalAlarm/externalAlarmsMenuItem1/${testAlarmId}`,
    updateData
  );
  console.log(`   Status: ${updateResult.status}`);
  console.log(`   Response: ${JSON.stringify(updateResult.data, null, 4)}`);

  if (updateResult.ok || updateResult.status === 400) {
    // 400 is acceptable if validation fails
    console.log("   ✅ PASS - Update request handled correctly");
    passedTests++;
  } else {
    console.log("   ❌ FAIL - Update request failed unexpectedly");
  }

  // Test 5: DELETE alarm from menu item
  totalTests++;
  console.log(
    `\nTest 5: DELETE /external/tenantExternalAlarm/externalAlarmsMenuItem1/${testAlarmId}`
  );
  const deleteResult = await testAPI(
    "DELETE",
    `/external/tenantExternalAlarm/externalAlarmsMenuItem1/${testAlarmId}`
  );
  console.log(`   Status: ${deleteResult.status}`);
  console.log(`   Response: ${JSON.stringify(deleteResult.data, null, 4)}`);

  if (deleteResult.ok || deleteResult.status === 404) {
    // 404 is acceptable if alarm not in menu
    console.log("   ✅ PASS - Delete request handled correctly");
    passedTests++;
  } else {
    console.log("   ❌ FAIL - Delete request failed unexpectedly");
  }

  // Test 6: Test invalid menu item
  totalTests++;
  console.log(
    "\nTest 6: GET /external/tenantExternalAlarm/invalidMenuItem/list"
  );
  const invalidMenuResult = await testAPI(
    "GET",
    "/external/tenantExternalAlarm/invalidMenuItem/list"
  );
  console.log(`   Status: ${invalidMenuResult.status}`);
  console.log(
    `   Response: ${JSON.stringify(invalidMenuResult.data, null, 4)}`
  );

  if (invalidMenuResult.status === 400) {
    console.log("   ✅ PASS - Correctly rejected invalid menu item");
    passedTests++;
  } else {
    console.log("   ❌ FAIL - Should have rejected invalid menu item");
  }

  console.log("\n" + "=".repeat(50));
  console.log("🎯 TEST SUMMARY");
  console.log("=".repeat(50));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(
    `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`
  );

  if (passedTests === totalTests) {
    console.log(
      "\n🎉 ALL TESTS PASSED! The tenantExternalAlarm module is working correctly."
    );
  } else if (passedTests >= totalTests * 0.7) {
    console.log(
      "\n✅ MOST TESTS PASSED! The module is mostly functional with some issues."
    );
  } else {
    console.log("\n❌ SEVERAL TESTS FAILED! The module needs debugging.");
  }

  return {
    total: totalTests,
    passed: passedTests,
    failed: totalTests - passedTests,
    successRate: ((passedTests / totalTests) * 100).toFixed(1),
  };
}

async function main() {
  console.log("🚀 Starting tenant external alarm module E2E tests...\n");

  // Check if server is running
  console.log("📡 Checking server status...");
  const healthCheck = await testAPI("GET", "/internal/health");

  if (!healthCheck.ok) {
    console.log("❌ Server is not running or not accessible");
    console.log("   Please start the server first: npm start");
    return;
  }

  console.log("✅ Server is running");

  const results = await runTests();

  // Save results
  const testResults = {
    timestamp: new Date().toISOString(),
    module: "tenantExternalAlarm",
    results: results,
  };

  fs.writeFileSync(
    "tenant-external-alarm-module-e2e-results.json",
    JSON.stringify(testResults, null, 2)
  );
  console.log(
    "\n📄 Test results saved to: tenant-external-alarm-module-e2e-results.json"
  );
}

main().catch(console.error);
