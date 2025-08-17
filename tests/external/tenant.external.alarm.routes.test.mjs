import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const BASE = process.env.BASE || "http://localhost:5000";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOKEN = fs
  .readFileSync(path.join(__dirname, "../../", "token.txt"), "utf8")
  .trim();
const TENANT_ID = process.env.TEST_TENANT_ID || "TENANT_TEST";
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
  "x-tenant-id": TENANT_ID,
};

async function req(method, urlPath, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
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

function sample() {
  return {
    serialNumber: `SN-EXT-${Math.random().toString(36).slice(2, 8)}`,
    sgmModuleType: "RTU5024",
    modelDescription: "External alarm device",
    accessDetails: { phoneNumber: "+27123456789", pin: "1234" },
  };
}

export async function run() {
  // Create
  const created = await req(
    "POST",
    `/services/neighbourGuardService/tenants/${TENANT_ID}/externalAlarmsList`,
    sample()
  );
  if (created.status !== 201)
    throw new Error(`Create failed: ${JSON.stringify(created)}`);
  const id = created.json?.data?.id;

  // Get
  const got = await req(
    "GET",
    `/services/neighbourGuardService/tenants/${TENANT_ID}/externalAlarmsList/${id}`
  );
  if (got.status !== 200) throw new Error(`Get failed: ${JSON.stringify(got)}`);

  // List
  const list = await req(
    "GET",
    `/services/neighbourGuardService/tenants/${TENANT_ID}/externalAlarmsList`
  );
  if (list.status !== 200)
    throw new Error(`List failed: ${JSON.stringify(list)}`);

  // Update
  const upd = await req(
    "PUT",
    `/services/neighbourGuardService/tenants/${TENANT_ID}/externalAlarmsList/${id}`,
    { modelDescription: "Updated external" }
  );
  if (upd.status !== 200)
    throw new Error(`Update failed: ${JSON.stringify(upd)}`);

  // Activate
  const act = await req(
    "PUT",
    `/services/neighbourGuardService/tenants/${TENANT_ID}/externalAlarmsList/activate/${id}`
  );
  if (act.status !== 200)
    throw new Error(`Activate failed: ${JSON.stringify(act)}`);

  // Deactivate
  const deact = await req(
    "PUT",
    `/services/neighbourGuardService/tenants/${TENANT_ID}/externalAlarmsList/deactivate/${id}`
  );
  if (deact.status !== 200)
    throw new Error(`Deactivate failed: ${JSON.stringify(deact)}`);

  return { ok: true, id };
}

const argv1 = process.argv[1];
const isMain =
  argv1 && import.meta.url === pathToFileURL(path.resolve(argv1)).href;
if (isMain) {
  run()
    .then((r) => {
      console.log("tenant.external.alarm e2e ok", r);
      process.exit(0);
    })
    .catch((e) => {
      console.error("tenant.external.alarm e2e failed", e.message);
      process.exit(1);
    });
}
