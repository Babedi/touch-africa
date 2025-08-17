const BASE = process.env.BASE_URL || "http://localhost:5000";
import path from "node:path";
import { fileURLToPath } from "node:url";
const fs = await import("fs/promises");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
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

async function req(method, pathUrl, body) {
  const t = await getToken();
  const headers = { "Content-Type": "application/json" };
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
  const p = path.join(__dirname, "payloads", "tenant.min.json");
  const raw = await fs.readFile(p, "utf8");
  const json = JSON.parse(raw);
  // randomize activationResponseBlockName to avoid uniqueness clash
  const suffix = Math.floor(Math.random() * 1e9);
  json.activationResponseBlockName = `${json.activationResponseBlockName}-${suffix}`;
  return json;
}

export async function testCreateTenant() {
  return req("POST", "/external/tenant", await loadPayload());
}

export async function testGetTenantById(id) {
  return req("GET", `/external/tenant/${id}`);
}

export async function testListTenants() {
  return req("GET", "/external/tenant/list");
}

export async function testUpdateTenant(id) {
  return req("PUT", `/external/tenant/${id}`, {});
}

export async function testActivateTenant(id) {
  return req("PUT", `/external/tenant/activate/${id}`, {});
}

export async function testDeactivateTenant(id) {
  return req("PUT", `/external/tenant/deactivate/${id}`, {});
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
      "Missing token for authenticated tenant routes (set TOKEN env or provide token.txt)"
    );
    process.exit(1);
  }

  let r = await testCreateTenant();
  log("CREATE TENANT", r);
  if (r.status !== 201) process.exit(1);
  const id = r.data?.data?.id;
  if (!id) process.exit(1);

  const list = await testListTenants();
  log("LIST TENANTS", list);
  if (list.status >= 300) process.exit(1);

  const getBy = await testGetTenantById(id);
  log("GET TENANT BY ID", getBy);
  if (getBy.status >= 300) process.exit(1);

  const upd = await testUpdateTenant(id);
  log("UPDATE TENANT", upd);
  if (upd.status >= 300) process.exit(1);

  const act = await testActivateTenant(id);
  log("ACTIVATE TENANT", act);
  if (act.status >= 300) process.exit(1);

  const deact = await testDeactivateTenant(id);
  log("DEACTIVATE TENANT", deact);
  if (deact.status >= 300) process.exit(1);
}

// Run only when executed directly (not when imported by the E2E runner)
const isDirect = (() => {
  try {
    const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
    return invoked === path.resolve(__filename);
  } catch {
    return false;
  }
})();
if (isDirect) runDirect();
