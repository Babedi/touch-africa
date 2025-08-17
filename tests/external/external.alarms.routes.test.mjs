import fs from "fs";
import https from "https";
import http from "http";
import { URL } from "url";

const TOKEN_FILE = "token.txt";
const BASE_URL = "http://localhost:5000";
const SERVICE_ID = "neighbourGuardService";
const TENANT_ID = "TNNT1754948681320";

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

async function testExternalAlarmsE2E() {
  console.log("=== External Alarms E2E Test ===\n");

  const testResults = [];
  const menuItems = [1, 2, 3, 4, 5];

  for (const item of menuItems) {
    const menuItem = `externalAlarmsMenuItem${item}`;
    console.log(`Testing ${menuItem}...`);

    // Test GET list (should be empty initially)
    const getListUrl = `${BASE_URL}/services/${SERVICE_ID}/tenants/${TENANT_ID}/externalAlarms/${menuItem}/list`;
    const listResult = await makeRequest(getListUrl, "GET");
    testResults.push({
      test: `GET ${menuItem} list`,
      status: listResult.status,
      success: listResult.success,
    });

    // Test PUT with sample alarm ID
    const putPayload = { [menuItem]: ["ALARM1754952343140"] };
    const putUrl = `${BASE_URL}/services/${SERVICE_ID}/tenants/${TENANT_ID}/externalAlarms/${menuItem}`;
    const putResult = await makeRequest(putUrl, "PUT", putPayload);
    testResults.push({
      test: `PUT ${menuItem}`,
      status: putResult.status,
      success: putResult.success,
    });

    // Test GET specific alarm
    const getAlarmUrl = `${BASE_URL}/services/${SERVICE_ID}/tenants/${TENANT_ID}/externalAlarms/${menuItem}/ALARM1754952343140`;
    const alarmResult = await makeRequest(getAlarmUrl, "GET");
    testResults.push({
      test: `GET alarm from ${menuItem}`,
      status: alarmResult.status,
      success: alarmResult.success,
    });

    // Test DELETE alarm
    const deleteUrl = `${BASE_URL}/services/${SERVICE_ID}/tenants/${TENANT_ID}/externalAlarms/${menuItem}/ALARM1754952343140`;
    const deleteResult = await makeRequest(deleteUrl, "DELETE");
    testResults.push({
      test: `DELETE alarm from ${menuItem}`,
      status: deleteResult.status,
      success: deleteResult.success,
    });
  }

  // Test GET all alarms
  const getAllUrl = `${BASE_URL}/services/${SERVICE_ID}/tenants/${TENANT_ID}/externalAlarms/list`;
  const allResult = await makeRequest(getAllUrl, "GET");
  testResults.push({
    test: "GET all external alarms",
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

testExternalAlarmsE2E().catch(console.error);
