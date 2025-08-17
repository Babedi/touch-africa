import fetch from "node-fetch";
import fs from "fs";

const BASE = process.env.POST_BASE || "http://localhost:5000";
const token = fs.readFileSync("token.txt", "utf8").trim();
const tenantId = process.env.POST_TENANT || "TENANT_TEST";

async function main() {
  const body = {
    serialNumber: `SN${Date.now()}`,
    sgmModuleType: "RTU5024",
    modelDescription: "External Security Control Panel - Commercial Grade",
    accessDetails: { phoneNumber: "+27123456789", pin: "1234" },
  };

  const res = await fetch(`${BASE}/external/tenantExternalAlarmList`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "x-tenant-id": tenantId,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  try {
    console.log("STATUS", res.status, JSON.parse(text));
  } catch {
    console.log("STATUS", res.status, text);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
