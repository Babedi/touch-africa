import fs from "fs";
import https from "https";
import http from "http";
import { URL } from "url";

const TOKEN_FILE = "token.txt";
const BASE_URL = "http://localhost:5000";

async function makeRequest(url, method = "GET", body = null) {
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
        },
      };

      const client = urlObj.protocol === "https:" ? https : http;

      const req = client.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const jsonData = data ? JSON.parse(data) : null;
            resolve({
              status: res.statusCode,
              data: jsonData,
              success: res.statusCode >= 200 && res.statusCode < 300,
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              data: data,
              success: res.statusCode >= 200 && res.statusCode < 300,
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

async function testTenantInternalAlarmE2E() {
  console.log("=== Tenant Internal Alarm E2E Test ===\n");

  const testResults = [];
  const menuItems = [1, 2, 3, 4, 5];

  for (const item of menuItems) {
    const menuItem = `internalAlarmsMenuItem${item}`;
    console.log(`Testing ${menuItem}...`);

    // Test GET menu item status (should be empty initially)
    const getStatusUrl = `${BASE_URL}/external/tenantInternalAlarm/${menuItem}`;
    const statusResult = await makeRequest(getStatusUrl, "GET");
    testResults.push({
      test: `GET ${menuItem} status`,
      status: statusResult.status,
      success: statusResult.success,
    });

    // Test PUT with sample alarm ID
    const putPayload = { [menuItem]: ["ALARM1754951274742"] };
    const putUrl = `${BASE_URL}/external/tenantInternalAlarm/${menuItem}`;
    const putResult = await makeRequest(putUrl, "PUT", putPayload);
    testResults.push({
      test: `PUT ${menuItem}`,
      status: putResult.status,
      success: putResult.success,
    });

    // Test GET specific alarm
    const getAlarmUrl = `${BASE_URL}/external/tenantInternalAlarm/${menuItem}/ALARM1754951274742`;
    const alarmResult = await makeRequest(getAlarmUrl, "GET");
    testResults.push({
      test: `GET alarm from ${menuItem}`,
      status: alarmResult.status,
      success: alarmResult.success,
    });

    // Test GET list
    const getListUrl = `${BASE_URL}/external/tenantInternalAlarm/${menuItem}/list`;
    const listResult = await makeRequest(getListUrl, "GET");
    testResults.push({
      test: `GET ${menuItem} list`,
      status: listResult.status,
      success: listResult.success,
    });

    // Test DELETE alarm
    const deleteUrl = `${BASE_URL}/external/tenantInternalAlarm/${menuItem}/ALARM1754951274742`;
    const deleteResult = await makeRequest(deleteUrl, "DELETE");
    testResults.push({
      test: `DELETE alarm from ${menuItem}`,
      status: deleteResult.status,
      success: deleteResult.success,
    });

    console.log(`  Completed ${menuItem} tests\n`);
  }

  // Test GET all alarms
  const getAllUrl = `${BASE_URL}/external/tenantInternalAlarm/list`;
  const getAllResult = await makeRequest(getAllUrl, "GET");
  testResults.push({
    test: "GET all internal alarms",
    status: getAllResult.status,
    success: getAllResult.success,
  });

  // Print results
  console.log("=== Test Results ===");
  const passedTests = testResults.filter((r) => r.success).length;
  const totalTests = testResults.length;

  testResults.forEach((result) => {
    const status = result.success ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} ${result.test} (${result.status})`);
  });

  console.log(`\nSummary: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log("🎉 All tests passed!");
  } else {
    console.log("⚠️  Some tests failed. Check the logs above.");
  }
}

testTenantInternalAlarmE2E().catch(console.error);
