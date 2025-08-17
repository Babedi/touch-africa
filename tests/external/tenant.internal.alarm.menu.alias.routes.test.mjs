import fs from "node:fs";

const BASE = process.env.BASE || "http://localhost:5000";
const TOKEN = fs.readFileSync("token.txt", "utf8").trim();
const TENANT_ID = process.env.TEST_TENANT_ID || "TENANT_TEST";
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

async function run() {
  // smoke test the new internal menu endpoints
  const all = await req("GET", "/external/tenantInternalAlarm/list");
  if (all.status !== 200) throw new Error(`list all internal menus failed`);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  run()
    .then(() => {
      console.log("internal alarm menu alias test OK");
      process.exit(0);
    })
    .catch((e) => {
      console.error(e.message);
      process.exit(1);
    });
}
