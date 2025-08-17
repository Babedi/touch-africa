import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE || "http://localhost:5000";
const TENANT_ID = process.env.TEST_TENANT_ID || "TENANT_TEST";
const TOKEN = fs
  .readFileSync(path.join(process.cwd(), "token.txt"), "utf8")
  .trim();

const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
  "x-tenant-id": TENANT_ID,
};

async function req(method, url, body) {
  const res = await fetch(`${BASE}${url}`, {
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

function listSample() {
  return {
    serialNumber: `SN-INT-${Math.random().toString(36).slice(2, 8)}`,
    sgmModuleType: "RTU5024",
    modelDescription: "Internal alarm device",
    accessDetails: { phoneNumber: "+27123456780", pin: "1234" },
  };
}

export async function run() {
  const keys = [
    "internalAlarmsMenuItem1",
    "internalAlarmsMenuItem2",
    "internalAlarmsMenuItem3",
    "internalAlarmsMenuItem4",
    "internalAlarmsMenuItem5",
  ];

  for (const key of keys) {
    // create an alarm in the internalAlarmsList first
    const created = await req(
      "POST",
      `/external/tenantInternalAlarmList`,
      listSample()
    );
    if (created.status !== 201)
      throw new Error(`create list alarm failed ${key}`);
    const id = created.json?.data?.id;

    // list menu
    const g1 = await req("GET", `/external/tenantInternalAlarm/${key}/list`);
    if (g1.status !== 200) throw new Error(`list ${key} failed`);

    // put
    const p1 = await req("PUT", `/external/tenantInternalAlarm/${key}`, {
      [key]: [id],
    });
    if (p1.status !== 200) throw new Error(`put ${key} failed`);

    const alarmId = id;

    // get one
    const g2 = await req(
      "GET",
      `/external/tenantInternalAlarm/${key}/${alarmId}`
    );
    if (![200, 404].includes(g2.status))
      throw new Error(`get ${key} one failed`);

    // delete
    const d1 = await req(
      "DELETE",
      `/external/tenantInternalAlarm/${key}/${alarmId}`
    );
    if (d1.status !== 200) throw new Error(`delete ${key} failed`);
  }

  // all
  const all = await req("GET", `/external/tenantInternalAlarm/list`);
  if (all.status !== 200) throw new Error(`get all failed`);

  return { ok: true };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  run()
    .then((r) => {
      console.log("tenant.internal.alarm.menu e2e ok", r);
      process.exit(0);
    })
    .catch((e) => {
      console.error("tenant.internal.alarm.menu e2e failed", e.message);
      process.exit(1);
    });
}
