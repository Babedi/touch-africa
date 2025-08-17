const BASE =
  process.env.BASE_URL || "http://localhost:" + (process.env.PORT || 5000);
import path from "node:path";
import { fileURLToPath } from "node:url";
const fs = await import("fs/promises");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const tokenPath = path.join(ROOT, "token.txt");

async function getToken() {
  try {
    return (await fs.readFile(tokenPath, "utf8")).trim();
  } catch {
    return process.env.TOKEN || "";
  }
}

async function req(method, url, body) {
  const token = await getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch {
    return { status: res.status, data: text };
  }
}

function payload() {
  const rnd = Math.floor(Math.random() * 1e9);
  return {
    title: "Mr",
    names: "Michael James",
    surname: "Thompson",
    subAddress: {
      streetOrFloor: "123 Sandton Central Drive",
      unit: String(rnd % 1000),
    },
    activationDetails: {
      phoneNumber: "+27845678901",
      pin: 1357,
      preferredMenuLanguage: "english",
      isATester: false,
    },
    account: { isActive: { value: true, changes: [] } },
  };
}

export async function run() {
  const tenantId = process.env.TENANT_ID || "TENANT_TEST";
  const userId = process.env.USER_ID || "USER_TEST";
  const base = `/external/privateResponders?tenantId=${tenantId}&userId=${userId}`;

  let r = await req("POST", base, payload());
  console.log("CREATE PR:", r.status, r.data?.success);
  if (r.status !== 201) return;
  const id = r.data?.data?.id;

  const l = await req("GET", base.replace("?", "/list?"));
  console.log("LIST PR:", l.status, Array.isArray(l.data?.data));

  const g = await req("GET", base.replace("?", `/${id}?`));
  console.log("GET PR:", g.status, g.data?.data?.id);

  const u = await req("PUT", base.replace("?", `/${id}?`), {
    surname: "Changed",
  });
  console.log("UPDATE PR:", u.status, u.data?.data?.surname);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(__filename)
) {
  run();
}
