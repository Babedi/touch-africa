import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE || "http://localhost:5000";
const tokenPath = path.resolve(process.cwd(), "token.txt");
const token = fs.readFileSync(tokenPath, "utf8").trim();
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

function payload() {
  return {
    activationResponseBlockName: `Sample Block ${Date.now()}`,
    address: {
      locality: "Sample Area",
      province: "Gauteng",
      country: "South Africa",
      postalCode: "2010",
    },
    activationContextMenu: {
      english: {
        menuItem1: "Life@Risk",
        menuItem2: "Property@Risk",
        menuItem3: "Both@Risk",
        menuItem4: "",
        menuItem5: "",
      },
    },
  };
}

async function main() {
  const res = await fetch(`${BASE}/external/tenant`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload()),
  });
  const text = await res.text();
  console.log("status:", res.status);
  console.log(text);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
