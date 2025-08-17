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

// tiny helpers
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

// Minimal valid admin payload
function sampleAdminPayload() {
  const ts = Date.now();
  return {
    roles: ["internalSuperAdmin"],
    title: "Mr",
    names: "Simon Lesedi",
    surname: "Babedi",
    accessDetails: {
      email: `sl.babedi+${ts}@neighbourguard.co.za`,
      password: "Secr3t!Ab",
      lastLogin: [],
    },
    account: {
      isActive: { value: true, changes: [] },
    },
    created: { by: "root", when: new Date().toISOString() },
  };
}

(async () => {
  // Ensure server is healthy before testing
  const healthy = await waitForHealth();
  if (!healthy) {
    console.error("Server not healthy at", BASE);
    process.exit(1);
  }
  // List
  let r = await req("GET", "/internal/admin/list");
  log("LIST", r);
  if (r.status >= 300) process.exit(1);

  // Create
  r = await req("POST", "/internal/admin", sampleAdminPayload());
  log("CREATE", r);
  if (r.status >= 300) process.exit(1);
  const id = r.data?.data?.id;

  // Get by ID
  const g = await req("GET", `/internal/admin/${id}`);
  log("GET BY ID", g);
  if (g.status >= 300) process.exit(1);

  // Update (surname)
  const u = await req("PUT", `/internal/admin/${id}`, { surname: "Babadu." });
  log("UPDATE", u);
  if (u.status >= 300) process.exit(1);

  // Activate
  const a = await req("PUT", `/internal/admin/activate/${id}`, {
    change: {
      to: true,
      when: new Date().toISOString(),
      by: "ADMIN_TEST",
      reason: "Manual test activate",
    },
  });
  log("ACTIVATE", a);
  if (a.status >= 300) process.exit(1);

  // Deactivate
  const d = await req("PUT", `/internal/admin/deactivate/${id}`, {
    change: {
      to: false,
      when: new Date().toISOString(),
      by: "ADMIN_TEST",
      reason: "Manual test deactivate",
    },
  });
  log("DEACTIVATE", d);
  if (d.status >= 300) process.exit(1);

  // Delete
  const del = await req("DELETE", `/internal/admin/${id}`);
  log("DELETE", del);
  if (del.status >= 300) process.exit(1);
})();
