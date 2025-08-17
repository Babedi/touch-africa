import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
    type: "human",
    name: `Responder ${Math.random().toString(36).slice(2, 7)}`,
    description: "",
    phoneNumber: "+27112345678",
    channel: "call",
    customMessage: "",
  };
}

export async function run() {
  const created = await req(
    "POST",
    `/services/neighbourGuardService/tenants/${TENANT_ID}/externalRespondersList`,
    sample()
  );
  if (created.status !== 201)
    throw new Error(`Create failed: ${JSON.stringify(created)}`);
  const id = created.json?.data?.id;

  const got = await req(
    "GET",
    `/services/neighbourGuardService/tenants/${TENANT_ID}/externalRespondersList/${id}`
  );
  if (got.status !== 200) throw new Error(`Get failed: ${JSON.stringify(got)}`);

  const list = await req(
    "GET",
    `/services/neighbourGuardService/tenants/${TENANT_ID}/externalRespondersList`
  );
  if (list.status !== 200)
    throw new Error(`List failed: ${JSON.stringify(list)}`);

  const upd = await req(
    "PUT",
    `/services/neighbourGuardService/tenants/${TENANT_ID}/externalRespondersList/${id}`,
    { customMessage: "updated" }
  );
  if (upd.status !== 200)
    throw new Error(`Update failed: ${JSON.stringify(upd)}`);

  const act = await req(
    "PUT",
    `/services/neighbourGuardService/tenants/${TENANT_ID}/externalRespondersList/activate/${id}`
  );
  if (act.status !== 200)
    throw new Error(`Activate failed: ${JSON.stringify(act)}`);

  const deact = await req(
    "PUT",
    `/services/neighbourGuardService/tenants/${TENANT_ID}/externalRespondersList/deactivate/${id}`
  );
  if (deact.status !== 200)
    throw new Error(`Deactivate failed: ${JSON.stringify(deact)}`);

  const del = await req(
    "DELETE",
    `/services/neighbourGuardService/tenants/${TENANT_ID}/externalRespondersList/${id}`
  );
  if (del.status !== 200 && del.status !== 204)
    throw new Error(`Delete failed: ${JSON.stringify(del)}`);

  return { ok: true, id };
}

const argv1 = process.argv[1];
const isMain =
  argv1 && import.meta.url === pathToFileURL(path.resolve(argv1)).href;
if (isMain) {
  run()
    .then((r) => {
      console.log("tenant.external.responder.list e2e ok", r);
      process.exit(0);
    })
    .catch((e) => {
      console.error("tenant.external.responder.list e2e failed", e.message);
      process.exit(1);
    });
}
