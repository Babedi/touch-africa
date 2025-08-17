// Quick POST script for /external/tenantUser
import fs from "node:fs";

const BASE =
  process.env.BASE_URL || "http://localhost:" + (process.env.PORT || 5000);
const token =
  (fs.existsSync("token.txt")
    ? fs.readFileSync("token.txt", "utf8").trim()
    : process.env.TOKEN) || "";
const TENANT_ID = process.env.TENANT_ID || "TENANT_TEST";

async function run() {
  const payload = {
    title: "Mr",
    names: "Michael James",
    surname: "Thompson",
    subAddress: { streetOrFloor: "123 Sandton Central Drive", unit: "101" },
    activationDetails: {
      phoneNumber: "+27845678901",
      pin: "1357",
      preferredMenuLanguage: "english",
      isATester: false,
    },
    account: { isActive: { value: true, changes: [] } },
  };
  const res = await fetch(BASE + "/external/tenantUser", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
      "x-tenant-id": TENANT_ID,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  console.log(res.status, text);
}

if (import.meta.url === `file://${process.argv[1]}`) run();
