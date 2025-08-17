const BASE = process.env.BASE_URL || "http://localhost:5000";
import path from "node:path";
import { fileURLToPath } from "node:url";
const fs = await import("fs/promises");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const tokenPath = path.join(ROOT, "token.txt");
const token = (await fs.readFile(tokenPath, "utf8")).trim();
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

function log(title, data) {
  console.log(`\n=== ${title} ===`);
  console.log(typeof data === "string" ? data : JSON.stringify(data, null, 2));
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
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
async function waitForHealth(timeoutMs = 30000) {
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

function sampleRootAdminPayload() {
  const ts = Date.now();
  return {
    roles: ["internalRootAdmin", "internalSuperAdmin"],
    title: "Mr",
    names: "Root Admin",
    surname: "User",
    accessDetails: {
      email: `root.test+${ts}@neighbourguard.co.za`,
      password: "Aa1!aaaa",
      lastLogin: [],
    },
    account: { isActive: { value: true, changes: [] } },
    created: { by: "root", when: new Date().toISOString() },
  };
}

(async () => {
  const healthy = await waitForHealth();
  if (!healthy) {
    console.error("Server not healthy at", BASE);
    process.exit(1);
  }

  // Ping
  let r = await req("GET", "/internal/rootAdmin/ping");
  log("PING", r);
  if (r.status >= 300) process.exit(1);

  // List
  r = await req("GET", "/internal/rootAdmin/list");
  log("LIST", r);
  if (r.status >= 300) process.exit(1);
  let id =
    Array.isArray(r.data?.data) && r.data.data.length
      ? r.data.data[0].id
      : null;

  // Create if none exists (policy allows only one)
  if (!id) {
    const create = await req(
      "POST",
      "/internal/rootAdmin",
      sampleRootAdminPayload()
    );
    log("CREATE", create);
    if (create.status !== 201 && create.status !== 409) process.exit(1);
  }

  // Re-list to get id
  const list2 = await req("GET", "/internal/rootAdmin/list");
  log("LIST_2", list2);
  if (list2.status >= 300) process.exit(1);
  id =
    Array.isArray(list2.data?.data) && list2.data.data.length
      ? list2.data.data[0].id
      : null;
  if (!id) {
    console.error("No root admin present after create/list sequence");
    process.exit(1);
  }

  // Get by ID
  const g = await req("GET", `/internal/rootAdmin/${id}`);
  log("GET BY ID", g);
  if (g.status >= 300) process.exit(1);

  // Update title
  const u = await req("PUT", `/internal/rootAdmin/${id}`, { title: "Mr" });
  log("UPDATE", u);
  if (u.status >= 300) process.exit(1);

  // Activate (allowed)
  const a = await req("PUT", `/internal/rootAdmin/activate/${id}`, {
    change: {
      to: true,
      when: new Date().toISOString(),
      by: "ROOTADMIN_TEST",
      reason: "Ensure account active",
    },
  });
  log("ACTIVATE", a);
  if (a.status >= 300) process.exit(1);

  // Deactivate (forbidden by policy) -> expect 403
  const d = await req("PUT", `/internal/rootAdmin/deactivate/${id}`, {
    change: {
      to: false,
      when: new Date().toISOString(),
      by: "ROOTADMIN_TEST",
      reason: "Policy should forbid this",
    },
  });
  log("DEACTIVATE (expected 403)", d);

  // Delete (forbidden by policy) -> expect 403
  const del = await req("DELETE", `/internal/rootAdmin/${id}`);
  log("DELETE (expected 403)", del);
})();
