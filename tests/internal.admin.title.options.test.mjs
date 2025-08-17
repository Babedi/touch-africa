const BASE = process.env.BASE_URL || "http://localhost:5000";
import { db } from "../services/firestore.client.js";

const SERVICE_ID = "neighbourGuardService";

function log(title, data) {
  console.log(`\n=== ${title} ===`);
  console.log(typeof data === "string" ? data : JSON.stringify(data, null, 2));
}

async function req(method, path, body, headers = {}) {
  const token = (
    await (
      await import("fs/promises")
    ).readFile(new URL("../token.txt", import.meta.url))
  )
    .toString()
    .trim();
  const h = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...headers,
  };
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: h,
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

function payloadWithTitle(title) {
  const ts = Date.now();
  return {
    roles: ["internalSuperAdmin"],
    title,
    names: "Title Test",
    surname: `User${ts}`,
    accessDetails: {
      email: `title.test+${ts}@neighbourguard.co.za`,
      password: "Secr3t!Ab",
      lastLogin: [],
    },
    account: { isActive: { value: true, changes: [] } },
    created: { by: "ADMIN_LOCAL_TEST", when: new Date().toISOString() },
  };
}

(async () => {
  const healthy = await waitForHealth();
  if (!healthy) {
    console.error("Server not healthy at", BASE);
    process.exit(1);
  }

  // Seed title options lookup
  await db
    .collection("services")
    .doc(SERVICE_ID)
    .collection("lookups")
    .doc("titlePrefixes")
    .set({ options: ["Mr", "Ms", "Dr"] }, { merge: true });
  log("SEEDED titlePrefixes", { options: ["Mr", "Ms", "Dr"] });

  // Attempt invalid title
  const invalid = await req("POST", "/internal/admin", payloadWithTitle("Sir"));
  log("CREATE INVALID TITLE", invalid);
  if (invalid.status !== 400) {
    console.error("Expected 400 for invalid title, got", invalid.status);
    process.exit(1);
  }

  // Attempt valid title
  const valid = await req("POST", "/internal/admin", payloadWithTitle("Mr"));
  log("CREATE VALID TITLE", valid);
  if (valid.status !== 201) {
    console.error("Expected 201 for valid title, got", valid.status);
    process.exit(1);
  }
  const id = valid.data?.data?.id;

  // Cleanup
  const del = await req("DELETE", `/internal/admin/${id}`);
  log("DELETE VALID USER", del);
  process.exit(0);
})();
