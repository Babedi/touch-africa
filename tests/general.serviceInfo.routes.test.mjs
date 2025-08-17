// Minimal E2E test script for serviceInfo routes
// Run with: node tests/general.serviceInfo.routes.test.mjs
import fs from "fs";

const BASE = process.env.BASE_URL || "http://localhost:5000";
const token = fs.existsSync("token.txt")
  ? fs.readFileSync("token.txt", "utf8").trim()
  : "";

async function getPublic() {
  const r = await fetch(`${BASE}/general/serviceInfo`);
  const t = await r.text();
  console.log("GET /general/serviceInfo ->", r.status, t.slice(0, 200));
}

async function putUpdate() {
  if (!token) {
    console.log("No token.txt; skipping PUT");
    return;
  }
  const payload = {
    version: "01.000.0002",
    taglines: ["When your circle become a life saver."],
  };
  const r = await fetch(`${BASE}/general/serviceInfo`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const t = await r.text();
  console.log("PUT /general/serviceInfo ->", r.status, t.slice(0, 200));
}

async function ping() {
  const r = await fetch(`${BASE}/general/serviceInfo/ping`);
  const t = await r.text();
  console.log("GET /general/serviceInfo/ping ->", r.status, t);
}

async function main() {
  await ping();
  await getPublic();
  await putUpdate();
}

main().catch((e) => console.error(e));
