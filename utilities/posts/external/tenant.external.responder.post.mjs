import fs from "node:fs";

const BASE = process.env.BASE || "http://localhost:5000";
const TOKEN = (
  process.env.TOKEN || fs.readFileSync("token.txt", "utf8")
).trim();
const TENANT_ID =
  process.env.TEST_TENANT_ID || process.env.TENANT_ID || "TENANT_TEST";

async function main() {
  const responders = (process.env.RESPONDERS || "").split(",").filter(Boolean);
  const res = await fetch(
    `${BASE}/services/neighbourGuardService/tenants/${TENANT_ID}/externalResponders/menuItem1`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
        "x-tenant-id": TENANT_ID,
      },
      body: JSON.stringify({ responders }),
    }
  );
  const text = await res.text();
  console.log(res.status, text);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
