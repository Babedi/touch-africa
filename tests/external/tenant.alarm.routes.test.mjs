import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const BASE = process.env.BASE || "http://localhost:5000";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOKEN = fs
  .readFileSync(path.join(__dirname, "../../", "token.txt"), "utf8")
  .trim();
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
  "x-tenant-id": process.env.TEST_TENANT_ID || "TENANT_TEST",
};

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
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
    serialNumber: `SN-${Math.random().toString(36).slice(2, 8)}`,
    sgmModuleType: "RTU5024",
    modelDescription: "External Security Control Panel - Commercial Grade",
    accessDetails: { phoneNumber: "+27123456789", pin: "1234" },
  };
}

export async function run() {
  const payload = sample();
  const created = await req("POST", "/external/tenantAlarm", payload);
  if (created.status !== 201)
    throw new Error(`Create failed: ${JSON.stringify(created)}`);
  const id = created.json?.data?.id;

  const got = await req("GET", `/external/tenantAlarm/${id}`);
  if (got.status !== 200) throw new Error(`Get failed: ${JSON.stringify(got)}`);

  const list = await req("GET", "/external/tenantAlarm/list");
  if (list.status !== 200)
    throw new Error(`List failed: ${JSON.stringify(list)}`);

  const upd = await req("PUT", `/external/tenantAlarm/${id}`, {
    modelDescription: "Updated model",
  });
  if (upd.status !== 200)
    throw new Error(`Update failed: ${JSON.stringify(upd)}`);

  const act = await req("PUT", `/external/tenantAlarm/activate/${id}`, {});
  if (act.status !== 200)
    throw new Error(`Activate failed: ${JSON.stringify(act)}`);

  const deact = await req("PUT", `/external/tenantAlarm/deactivate/${id}`, {});
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
      console.log("tenant.alarm e2e ok", r);
      process.exit(0);
    })
    .catch((e) => {
      console.error("tenant.alarm e2e failed", e.message);
      process.exit(1);
    });
}
