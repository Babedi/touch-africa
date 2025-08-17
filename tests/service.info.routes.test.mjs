import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import https from "node:https";

const BASE = process.env.BASE_URL || "http://localhost:5000";
const tokenPath = path.resolve("token.txt");
const token = fs.existsSync(tokenPath)
  ? fs.readFileSync(tokenPath, "utf8").trim()
  : "";
if (!token) {
  console.error("No token in token.txt");
  process.exit(1);
}

function httpRequest(method, urlStr, headers, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const mod = url.protocol === "https:" ? https : http;
    const req = mod.request(
      {
        method,
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: url.pathname + (url.search || ""),
        headers,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          resolve({ status: res.statusCode || 0, text });
        });
      }
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function waitForHealth(timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await httpRequest("GET", `${BASE}/internal/health`, {}, null);
      if (res.status === 200) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

const payload = {
  logo: "https://cdn.neighbourguard.com/logo.png",
  name: "NeighbourGuard",
  initialized: new Date().toISOString(),
  version: "01.000.0001",
  active: true,
  descriptions: [
    "This turns every mobile into an emergency activation device",
    "This service is designed to enhance personal safety by enabling quick emergency alerts.",
  ],
  features: [
    {
      title: "Emergency Communication",
      text: "Emergency alerts via SMS, WhatsApp, and calls. Fast and reliable for your safety in emergencies.",
    },
  ],
  emphasizes: ["tenant response and neighbour accountability."],
  taglines: ["Your personal safety network at your fingertips."],
  communicationChannels: {
    support: { number: "+27635941451", email: "support@neighbourguard.com" },
    finance: { number: "+27635941451", email: "finance@neighbourguard.com" },
    general: { number: "+27635941451", email: "general@neighbourguard.com" },
    service_request: {
      number: "+27635941451",
      email: "service.requests@neighbourguard.com",
    },
    careers: { number: "+27635941451", email: "careers@neighbourguard.com" },
    complaints: {
      number: "+27635941451",
      email: "complains@neighbourguard.com",
    },
    complements: {
      number: "+27635941451",
      email: "complements@neighbourguard.com",
    },
    sales: { number: "+27635941451", email: "sales@neighbourguard.com" },
  },
  social: {
    facebook: { url: "https://facebook.com/neighbourguard", icon: "facebook" },
    linkedin: {
      url: "https://linkedin.com/company/neighbourguard",
      icon: "linkedin",
    },
    twitter: { url: "https://twitter.com/neighbourguard", icon: "twitter" },
    instagram: {
      url: "https://instagram.com/neighbourguard",
      icon: "instagram",
    },
  },
};

async function main() {
  const healthy = await waitForHealth();
  if (!healthy) {
    console.error("Server not healthy at", BASE);
    process.exit(2);
  }

  // PUT update
  const putHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  const putRes = await httpRequest(
    "PUT",
    `${BASE}/general/serviceInfo`,
    putHeaders,
    Buffer.from(JSON.stringify(payload))
  );
  console.log("PUT status:", putRes.status);
  console.log(putRes.text);

  // GET verify
  const getRes = await httpRequest(
    "GET",
    `${BASE}/general/serviceInfo`,
    {},
    null
  );
  console.log("GET status:", getRes.status);
  console.log(getRes.text);

  // Expect JSON success
  try {
    const j = JSON.parse(getRes.text);
    if (j?.success !== true) throw new Error("GET success false");
    process.exit(0);
  } catch (e) {
    console.error("Parse/Assert failed:", e.message);
    process.exit(1);
  }
}

main();
