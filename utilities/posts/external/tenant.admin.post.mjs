import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE || "http://localhost:5000";
const TENANT_ID =
  process.env.TENANT_ID || process.env.TEST_TENANT_ID || "TENANT_TEST";
const tokenPath = path.resolve(process.cwd(), "token.txt");
const token = fs.readFileSync(tokenPath, "utf8").trim();
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

function payload() {
  return {
    roles: ["externalSuperAdmin"],
    title: "Mr",
    names: "Simon Lesedi",
    surname: "Babedi",
    accessDetails: {
      email: "sl.babedi@neighbourguard.co.za",
      password: "SecureAdminPass123",
      lastLogin: [],
    },
    account: { isActive: { value: true, changes: [] } },
  };
}

async function main() {
  const res = await fetch(`${BASE}/external/tenantAdmin/${TENANT_ID}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload()),
  });
  const text = await res.text();
  console.log("status:", res.status);
  console.log(text);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
