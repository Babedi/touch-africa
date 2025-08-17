import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const BASE = process.env.BASE || "http://localhost:5000";
const TENANT_ID =
  process.env.TENANT_ID || process.env.TEST_TENANT_ID || "TENANT_TEST";
const USER_ID = process.env.USER_ID || "USER_TEST";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOKEN = fs
  .readFileSync(path.join(__dirname, "../../", "token.txt"), "utf8")
  .trim();
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
  "x-tenant-id": TENANT_ID,
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
    title: "Mr",
    names: "Michael James",
    surname: "Thompson",
    subAddress: { streetOrFloor: "123 Sandton Central Drive", unit: "101" },
    activationDetails: {
      phoneNumber: "+27845678901",
      pin: "1357",
      preferredMenuLanguage: "english",
      isATester: false,
    },
    account: { isActive: { value: true, changes: [] } },
  };
}

export async function run() {
  const payload = sample();
  const created = await req(
    "POST",
    `/external/tenantUserPrivateResponders/${USER_ID}`,
    payload
  );
  if (created.status !== 201)
    throw new Error(`Create failed: ${JSON.stringify(created)}`);
  const id = created.json?.data?.id;

  const got = await req(
    "GET",
    `/external/tenantUserPrivateResponders/${USER_ID}/${id}`
  );
  if (got.status !== 200) throw new Error(`Get failed: ${JSON.stringify(got)}`);

  const list = await req(
    "GET",
    `/external/tenantUserPrivateResponders/list/${USER_ID}`
  );
  if (list.status !== 200)
    throw new Error(`List failed: ${JSON.stringify(list)}`);

  const upd = await req(
    "PUT",
    `/external/tenantUserPrivateResponders/${USER_ID}/${id}`,
    { names: "Michael Updated" }
  );
  if (upd.status !== 200)
    throw new Error(`Update failed: ${JSON.stringify(upd)}`);

  const del = await req(
    "DELETE",
    `/external/tenantUserPrivateResponders/${USER_ID}/${id}`
  );
  if (del.status !== 200)
    throw new Error(`Delete failed: ${JSON.stringify(del)}`);

  return { ok: true, id };
}

const argv1 = process.argv[1];
const isMain =
  argv1 && import.meta.url === pathToFileURL(path.resolve(argv1)).href;
if (isMain) {
  run()
    .then((r) => {
      console.log("tenant.user.private.responders e2e ok", r);
      process.exit(0);
    })
    .catch((e) => {
      console.error("tenant.user.private.responders e2e failed", e.message);
      process.exit(1);
    });
}
