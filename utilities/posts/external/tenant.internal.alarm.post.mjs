import fs from "fs";

const BASE = process.env.BASE || "http://localhost:5000";
const token = fs.readFileSync("token.txt", "utf8").trim();
const TENANT_ID = process.env.TEST_TENANT_ID || "TENANT_TEST";

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  "x-tenant-id": TENANT_ID,
};

async function main() {
  // create internal list alarm to reference
  const payload = {
    serialNumber: `SN-INT-${Date.now()}`,
    sgmModuleType: "RTU5024",
    modelDescription: "Internal alarm",
    accessDetails: { phoneNumber: "+27123456780", pin: "1234" },
  };
  const created = await fetch(`${BASE}/external/tenantInternalAlarmList`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const createdJson = await created.json();
  const id = createdJson?.data?.id;

  const put = await fetch(
    `${BASE}/external/tenantInternalAlarm/internalAlarmsMenuItem1`,
    { method: "PUT", headers, body: JSON.stringify({ alarmIds: [id] }) }
  );
  const text = await put.text();
  console.log("PUT internal menu status", put.status, text);
}

main().catch(console.error);
