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

function responderSample() {
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
  // First create two responders in the list
  const c1 = await req(
    "POST",
    `/services/neighbourGuardService/tenants/${TENANT_ID}/externalRespondersList`,
    responderSample()
  );
  if (c1.status !== 201)
    throw new Error(`Create failed: ${JSON.stringify(c1)}`);
  const id1 = c1.json?.data?.id;

  const c2 = await req(
    "POST",
    `/services/neighbourGuardService/tenants/${TENANT_ID}/externalRespondersList`,
    responderSample()
  );
  if (c2.status !== 201)
    throw new Error(`Create failed: ${JSON.stringify(c2)}`);
  const id2 = c2.json?.data?.id;

  // Put a menu item with these IDs
  const put1 = await req(
    "PUT",
    `/services/neighbourGuardService/tenants/${TENANT_ID}/externalResponders/menuItem1`,
    { responders: [id1, id2] }
  );
  if (put1.status !== 200)
    throw new Error(`Put menu failed: ${JSON.stringify(put1)}`);

  // List menu
  const list = await req(
    "GET",
    `/services/neighbourGuardService/tenants/${TENANT_ID}/externalResponders`
  );
  if (list.status !== 200)
    throw new Error(`Menu list failed: ${JSON.stringify(list)}`);

  // Get item by id
  const got = await req(
    "GET",
    `/services/neighbourGuardService/tenants/${TENANT_ID}/externalResponders/menuItem1`
  );
  if (got.status !== 200)
    throw new Error(`Menu get failed: ${JSON.stringify(got)}`);

  // Bulk put (clear menuItem2..5)
  const bulk = await req(
    "PUT",
    `/services/neighbourGuardService/tenants/${TENANT_ID}/externalResponders`,
    {
      menuItem1: [id1],
      menuItem2: [],
      menuItem3: [],
      menuItem4: [],
      menuItem5: [],
    }
  );
  if (bulk.status !== 200)
    throw new Error(`Bulk put failed: ${JSON.stringify(bulk)}`);

  // Delete item
  const del = await req(
    "DELETE",
    `/services/neighbourGuardService/tenants/${TENANT_ID}/externalResponders/menuItem1`
  );
  if (del.status !== 200 && del.status !== 204)
    throw new Error(`Delete item failed: ${JSON.stringify(del)}`);

  return { ok: true, ids: [id1, id2] };
}

const argv1 = process.argv[1];
const isMain =
  argv1 && import.meta.url === pathToFileURL(path.resolve(argv1)).href;
if (isMain) {
  run()
    .then((r) => {
      console.log("tenant.external.responder.menu e2e ok", r);
      process.exit(0);
    })
    .catch((e) => {
      console.error("tenant.external.responder.menu e2e failed", e.message);
      process.exit(1);
    });
}
