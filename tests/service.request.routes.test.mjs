const BASE = process.env.BASE_URL || "http://localhost:5000";
import path from "node:path";
import { fileURLToPath } from "node:url";
const fs = await import("fs/promises");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const tokenPath = path.join(ROOT, "token.txt");
let token = "";
try {
  token = (await fs.readFile(tokenPath, "utf8")).trim();
} catch {}

function log(title, data) {
  console.log(`\n=== ${title} ===`);
  console.log(typeof data === "string" ? data : JSON.stringify(data, null, 2));
}

async function req(method, path, body, auth = false) {
  const headers = { "Content-Type": "application/json" };
  if (auth && token) headers.Authorization = `Bearer ${token}`;
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

function sample() {
  return {
    title: "Mr",
    names: "Simon Lesedi",
    surname: "Babedi",
    company: "",
    role: "",
    typeOfUser: "I am a Client",
    messageRelationTo: "Sale",
    message:
      "I need to know how can I get a hold of you and arrange to purchase",
    contactInfo: {
      phoneNumber: "+27635941451",
      email: "lesedi.simon@gmail.com",
    },
  };
}

(async () => {
  const healthy = await waitForHealth();
  if (!healthy) {
    console.error("Server not healthy at", BASE);
    process.exit(1);
  }

  // Public POST
  let r = await req("POST", "/internal/serviceRequest", sample());
  log("CREATE PUBLIC", r);
  if (r.status !== 201) process.exit(1);
  const id = r.data?.data?.id;

  // Protected LIST
  const list = await req(
    "GET",
    "/internal/serviceRequest/list",
    undefined,
    true
  );
  log("LIST", list);
  if (list.status >= 300) process.exit(1);

  // Protected GET BY ID
  const getBy = await req(
    "GET",
    `/internal/serviceRequest/${id}`,
    undefined,
    true
  );
  log("GET BY ID", getBy);
  if (getBy.status >= 300) process.exit(1);

  // Protected UPDATE
  const upd = await req(
    "PUT",
    `/internal/serviceRequest/${id}`,
    { company: "NeighbourGuard" },
    true
  );
  log("UPDATE", upd);
  if (upd.status >= 300) process.exit(1);

  // Activate / Deactivate
  const act = await req(
    "PUT",
    `/internal/serviceRequest/activate/${id}`,
    {},
    true
  );
  log("ACTIVATE", act);
  const deact = await req(
    "PUT",
    `/internal/serviceRequest/deactivate/${id}`,
    {},
    true
  );
  log("DEACTIVATE", deact);
})();
