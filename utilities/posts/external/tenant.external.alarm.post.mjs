import fetch from "node-fetch";
import fs from "fs";

console.log("📋 TENANT EXTERNAL ALARM POST UTILITY");
console.log("=====================================");

const BASE = process.env.POST_BASE || "http://localhost:5000";
const token = fs.readFileSync("token.txt", "utf8").trim();
const tenantId = process.env.POST_TENANT || "TNNT1754948681320";

async function main() {
  console.log("🚀 Testing tenant external alarm module operations...\n");

  // Use the alarm IDs that exist in the database (from task output history)
  const testAlarmIds = [
    "ALARM1754952343140",
    "ALARM1754955112345",
    "ALARM1754955113002",
  ];

  console.log(`✅ Using test alarm IDs: ${testAlarmIds.join(", ")}\n`);

  // Test 1: Update menu item 1 with alarm IDs
  console.log("📝 Test 1: Updating externalAlarmsMenuItem1...");
  const body = { alarmIds: testAlarmIds };

  const res = await fetch(
    `${BASE}/external/tenantExternalAlarm/externalAlarmsMenuItem1/${testAlarmIds[0]}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify(body),
    }
  );

  const text = await res.text();
  let responseData;
  try {
    responseData = JSON.parse(text);
  } catch {
    responseData = text;
  }

  console.log("STATUS", res.status);
  console.log("RESPONSE", responseData);
  console.log("");

  if (res.ok) {
    // Test 2: Get the menu item we just updated
    console.log("📖 Test 2: Getting externalAlarmsMenuItem1 list...");
    const getRes = await fetch(
      `${BASE}/external/tenantExternalAlarm/externalAlarmsMenuItem1/list`,
      {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": tenantId },
      }
    );

    const getResponse = await getRes.text();
    let getResponseData;
    try {
      getResponseData = JSON.parse(getResponse);
    } catch {
      getResponseData = getResponse;
    }

    console.log("GET STATUS", getRes.status);
    console.log("GET RESPONSE", getResponseData);
    console.log("");

    // Test 3: Get specific alarm from menu item
    console.log(
      `📖 Test 3: Getting specific alarm ${testAlarmIds[0]} from externalAlarmsMenuItem1...`
    );
    const getSpecificRes = await fetch(
      `${BASE}/external/tenantExternalAlarm/externalAlarmsMenuItem1/${testAlarmIds[0]}`,
      {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": tenantId },
      }
    );

    const getSpecificResponse = await getSpecificRes.text();
    let getSpecificResponseData;
    try {
      getSpecificResponseData = JSON.parse(getSpecificResponse);
    } catch {
      getSpecificResponseData = getSpecificResponse;
    }

    console.log("GET SPECIFIC STATUS", getSpecificRes.status);
    console.log("GET SPECIFIC RESPONSE", getSpecificResponseData);
    console.log("");

    // Test 4: Delete alarm from menu item
    if (testAlarmIds.length > 1) {
      console.log(
        `🗑️ Test 4: Deleting alarm ${testAlarmIds[1]} from externalAlarmsMenuItem1...`
      );
      const deleteRes = await fetch(
        `${BASE}/external/tenantExternalAlarm/externalAlarmsMenuItem1/${testAlarmIds[1]}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-tenant-id": tenantId,
          },
        }
      );

      const deleteResponse = await deleteRes.text();
      let deleteResponseData;
      try {
        deleteResponseData = JSON.parse(deleteResponse);
      } catch {
        deleteResponseData = deleteResponse;
      }

      console.log("DELETE STATUS", deleteRes.status);
      console.log("DELETE RESPONSE", deleteResponseData);
    }
  } else {
    console.log("❌ PUT request failed, skipping additional tests");

    // Test the direct route endpoints to debug
    console.log("\n🔍 Debug: Testing route availability...");

    // Test the basic GET all endpoint
    const getAllRes = await fetch(`${BASE}/external/tenantExternalAlarm/list`, {
      headers: { Authorization: `Bearer ${token}`, "x-tenant-id": tenantId },
    });

    console.log(`GET ALL STATUS: ${getAllRes.status}`);

    // Test menu item 1 list endpoint
    const getMenuItem1Res = await fetch(
      `${BASE}/external/tenantExternalAlarm/externalAlarmsMenuItem1/list`,
      {
        headers: { Authorization: `Bearer ${token}`, "x-tenant-id": tenantId },
      }
    );

    console.log(`GET MENU ITEM 1 LIST STATUS: ${getMenuItem1Res.status}`);
  }

  console.log("\n🏁 Test complete!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
