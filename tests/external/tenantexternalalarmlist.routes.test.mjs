import fetch from "node-fetch";
import fs from "fs";

const BASE = process.env.TEST_BASE || "http://localhost:5000";
const token = fs.readFileSync("token.txt", "utf8").trim();

function headers(extra = {}) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "x-tenant-id": process.env.TEST_TENANT || "TENANT_TEST",
    ...extra,
  };
}

async function http(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

(async () => {
  console.log("Running tenantExternalAlarmList E2E...");
  // Create new
  const sample = {
    serialNumber: "SN123456",
    sgmModuleType: "RTU5024",
    modelDescription: "External Security Control Panel - Commercial Grade",
    accessDetails: { phoneNumber: "+27123456789", pin: "1234" },
  };
  const create = await http(
    "POST",
    "/external/tenantExternalAlarmList",
    sample
  );
  console.log("CREATE", create.status, create.json);

  // List
  const list = await http("GET", "/external/tenantExternalAlarmList/list");
  console.log("LIST", list.status, list.json.data && list.json.data.length);

  if (list.json.data && list.json.data[0] && list.json.data[0].id) {
    const id = list.json.data[0].id;
    const get = await http("GET", `/external/tenantExternalAlarmList/${id}`);
    console.log("GET", get.status, get.json.success);

    const upd = await http("PUT", `/external/tenantExternalAlarmList/${id}`, {
      modelDescription: "Updated",
    });
    console.log("UPDATE", upd.status, upd.json.success);

    // Delete (optional, might require privileges)
    // const del = await http("DELETE", `/external/tenantExternalAlarmList/${id}`);
    // console.log("DELETE", del.status, del.json.success);
  }
})();
