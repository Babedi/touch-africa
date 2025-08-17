import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE || "http://localhost:5000";
const TENANT_ID =
  process.env.TENANT_ID || process.env.TEST_TENANT_ID || "TENANT_TEST";
const USER_ID = process.env.USER_ID || "USER_TEST";
const tokenPath = path.resolve(process.cwd(), "token.txt");
const token = fs.readFileSync(tokenPath, "utf8").trim();
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  "x-tenant-id": TENANT_ID,
};

function payload() {
  return {
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
}

async function main() {
  const res = await fetch(
    `${BASE}/external/tenantUserPrivateResponders/${USER_ID}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload()),
    }
  );
  const text = await res.text();
  console.log("status:", res.status);
  console.log(text);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
