import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE || "http://localhost:5000";
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const TOKEN = fs
  .readFileSync(path.join(process.cwd(), "token.txt"), "utf8")
  .trim();
const TENANT_ID = process.env.TEST_TENANT_ID || "TENANT_TEST";
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
  "x-tenant-id": TENANT_ID,
};

async function req(method, urlPath, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: HEADERS,
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

function sampleListItem() {
  return {
    serialNumber: `SN-EXT-${Math.random().toString(36).slice(2, 8)}`,
    sgmModuleType: "RTU5024",
    modelDescription: "External alarm",
    accessDetails: { phoneNumber: "+27123456789", pin: "1234" },
  };
}

export async function run() {
  // create one list item to reference
  const created = await req(
    "POST",
    `/services/neighbourGuardService/tenants/${TENANT_ID}/externalAlarmsList`,
    sampleListItem()
  );
  if (created.status !== 201)
    throw new Error(`Create list failed: ${created.status}`);
  const id = created.json?.data?.id;

  const key = "externalAlarmsMenuItem1";

  // put ids
  const put = await req("PUT", `/external/tenantExternalAlarm/${key}`, {
    alarmIds: [id],
  });
  if (put.status !== 200) throw new Error(`Put menu failed: ${put.status}`);

  // get list
  const ls = await req("GET", `/external/tenantExternalAlarm/${key}/list`);
  if (ls.status !== 200) throw new Error(`Get menu list failed: ${ls.status}`);

  // get one
  const one = await req("GET", `/external/tenantExternalAlarm/${key}/${id}`);
  if (![200, 404].includes(one.status))
    throw new Error(`Get one failed: ${one.status}`);

  // delete one
  const del = await req("DELETE", `/external/tenantExternalAlarm/${key}/${id}`);
  if (del.status !== 200) throw new Error(`Delete failed: ${del.status}`);

  // get all
  const all = await req("GET", `/external/tenantExternalAlarm/list`);
  if (all.status !== 200)
    throw new Error(`Get all menus failed: ${all.status}`);

  return { ok: true };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  run()
    .then((r) => {
      console.log("tenant.external.alarm.menu e2e ok", r);
      process.exit(0);
    })
    .catch((e) => {
      console.error("tenant.external.alarm.menu e2e failed", e.message);
      process.exit(1);
    });
}
