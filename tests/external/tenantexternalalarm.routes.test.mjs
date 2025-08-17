import fetch from "node-fetch";
import fs from "fs";

const BASE = process.env.TEST_BASE || "http://localhost:5000";
const token = fs.readFileSync("token.txt", "utf8").trim();
const tenantId = process.env.TEST_TENANT || "TENANT_TEST";

function headers(extra = {}) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "x-tenant-id": tenantId,
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
  console.log("Running tenantExternalAlarm menu E2E...");
  // First, list the available externalAlarmsList ids for this tenant via API we added
  const listResp = await http("GET", "/external/tenantExternalAlarmList/list");
  const ids = (listResp.json.data || []).map((d) => d.id);
  const choose = ids.slice(0, 2);

  const body = { externalAlarmsMenuItem1: choose };
  const put = await http(
    "PUT",
    `/external/tenantExternalAlarm/externalAlarmsMenuItem1/${
      choose[0] || "ALARM0"
    }`,
    body
  );
  console.log("PUT menu1", put.status, put.json);

  const getItem = await http(
    "GET",
    `/external/tenantExternalAlarm/externalAlarmsMenuItem1/${
      choose[0] || "ALARM0"
    }`
  );
  console.log("GET item", getItem.status, getItem.json);

  const getList = await http(
    "GET",
    `/external/tenantExternalAlarm/externalAlarmsMenuItem1/list`
  );
  console.log("GET list", getList.status, getList.json);

  const all = await http("GET", `/external/tenantExternalAlarm/list`);
  console.log("GET all", all.status, (all.json.data || []).length);
})();
