// E2E route testing for external/tenantuser
import fetch from "node-fetch";
import fs from "fs";

const token = fs.readFileSync("token.txt", "utf8").trim();
const base = "http://localhost:5051/external/tenantuser";
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
};

const validPayload = {
  title: "Mr",
  names: "Michael James",
  surname: "Thompson",
  subAddress: {
    streetOrFloor: "123 Sandton Central Drive",
    unit: "101",
  },
  activationDetails: {
    phoneNumber: "+27845678901",
    pin: "1357",
    preferredMenuLanguage: "english",
    isATester: true,
  },
  account: {
    isActive: {
      value: true,
      changes: [],
    },
  },
};

async function run() {
  // Create
  let res = await fetch(base, {
    method: "POST",
    headers,
    body: JSON.stringify(validPayload),
  });
  let data = await res.json();
  console.log("POST /tenantuser:", data);
  const id = data.data?.id;

  // Get by ID
  res = await fetch(`${base}/${id}`, { headers });
  data = await res.json();
  console.log("GET /tenantuser/:id:", data);

  // Update
  res = await fetch(`${base}/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ names: "Michael J." }),
  });
  data = await res.json();
  console.log("PUT /tenantuser/:id:", data);

  // List
  res = await fetch(`${base}/list`, { headers });
  data = await res.json();
  console.log("GET /tenantuser/list:", data);

  // Delete
  res = await fetch(`${base}/${id}`, { method: "DELETE", headers });
  data = await res.json();
  console.log("DELETE /tenantuser/:id:", data);
}

run().catch(console.error);
