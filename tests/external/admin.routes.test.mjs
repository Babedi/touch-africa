const BASE = process.env.BASE_URL || "http://localhost:5000";
import path from "node:path";
import { fileURLToPath } from "node:url";
const fs = await import("fs/promises");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const tokenPath = path.join(ROOT, "token.txt");

let tokenCache = undefined;
async function getToken() {
  if (process.env.TOKEN) return process.env.TOKEN;
  if (tokenCache !== undefined) return tokenCache;
  try {
    tokenCache = (await fs.readFile(tokenPath, "utf8")).trim();
  } catch {
    tokenCache = "";
  }
  return tokenCache;
}

function log(title, data) {
  console.log(`\n=== ${title} ===`);
  console.log(typeof data === "string" ? data : JSON.stringify(data, null, 2));
}

async function req(method, pathUrl, body, extraHeaders = {}) {
  const t = await getToken();
  const headers = { "Content-Type": "application/json", ...extraHeaders };
  if (t) headers.Authorization = `Bearer ${t}`; // protected routes
  const res = await fetch(`${BASE}${pathUrl}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, data: json };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function waitForHealth(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/internal/health`);
      if (res.ok) return true;
    } catch {}
    await sleep(500);
  }
  return false;
}

async function loadPayload() {
  const p = path.join(ROOT, "tests", "payloads", "admin.min.json");
  const raw = await fs.readFile(p, "utf8");
  const json = JSON.parse(raw);
  // Slight randomization for email to avoid collisions
  const suffix = Math.floor(Math.random() * 1e9);
  json.accessDetails.email = json.accessDetails.email.replace(
    /^(.*)@/,
    `$1+${suffix}@`
  );
  return json;
}

const tenantId = process.env.TENANT_ID || "TENANT_TEST";
const tenantHeader = { "x-tenant-id": tenantId };

export async function testCreateAdmin() {
  return req("POST", "/external/admin", await loadPayload(), tenantHeader);
}

export async function testGetAdminById(id) {
  return req("GET", `/external/admin/${id}`, undefined, tenantHeader);
}

export async function testListAdmins() {
  return req("GET", "/external/admin/list", undefined, tenantHeader);
}

export async function testUpdateAdmin(id) {
  return req("PUT", `/external/admin/${id}`, {}, tenantHeader);
}

export async function testActivateAdmin(id) {
  return req("PUT", `/external/admin/activate/${id}`, {}, tenantHeader);
}

export async function testDeactivateAdmin(id) {
  return req("PUT", `/external/admin/deactivate/${id}`, {}, tenantHeader);
}

async function runDirect() {
  const healthy = await waitForHealth();
  if (!healthy) {
    console.error("Server not healthy at", BASE);
    process.exit(1);
  }
  const t = await getToken();
  if (!t) {
    console.error(
      "Missing token for authenticated external admin routes (set TOKEN env or provide token.txt)"
    );
    process.exit(1);
  }

  let r = await testCreateAdmin();
  log("CREATE EXTERNAL ADMIN", r);
  if (r.status !== 201) process.exit(1);
  const id = r.data?.data?.id;
  if (!id) process.exit(1);

  const list = await testListAdmins();
  log("LIST EXTERNAL ADMINS", list);
  if (list.status >= 300) process.exit(1);

  const getBy = await testGetAdminById(id);
  log("GET EXTERNAL ADMIN BY ID", getBy);
  if (getBy.status >= 300) process.exit(1);

  const upd = await testUpdateAdmin(id);
  log("UPDATE EXTERNAL ADMIN", upd);
  if (upd.status >= 300) process.exit(1);

  const act = await testActivateAdmin(id);
  log("ACTIVATE EXTERNAL ADMIN", act);
  if (act.status >= 300) process.exit(1);

  const deact = await testDeactivateAdmin(id);
  log("DEACTIVATE EXTERNAL ADMIN", deact);
  if (deact.status >= 300) process.exit(1);
}

const isDirect = (() => {
  try {
    const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
    return invoked === path.resolve(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();
if (isDirect) runDirect();
