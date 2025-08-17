import assert from "assert";

const BASE_URL =
  process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

async function getToken() {
  try {
    const fs = await import("fs");
    return fs.readFileSync("token.txt", "utf8").trim();
  } catch {
    return process.env.TOKEN || "";
  }
}

export async function run() {
  const token = await getToken();
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "x-tenant-id": process.env.TENANT_ID || "TENANT_TEST",
  };

  // list all menus
  const res1 = await fetch(
    `${BASE_URL}/external/tenantInternalResponder/menu`,
    { headers }
  );
  assert.ok(res1.ok, "list all menus should 200");
  const all = await res1.json();
  console.log("menus keys:", Object.keys(all.data));

  // put empty list on item1 for safety
  const res2 = await fetch(
    `${BASE_URL}/external/tenantInternalResponder/menu/internalRespondersMenuItem1/RSPNDR0`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify({ internalRespondersMenuItem1: [] }),
    }
  );
  // We ignore status since ID won't exist; only check we get JSON
  await res2.text();
}

if (import.meta.url === `file://${process.argv[1]}`) run();
