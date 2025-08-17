import fetch from "node-fetch";
import assert from "assert";
import fs from "fs";

const token = fs.readFileSync("token.txt", "utf8").trim();
const baseUrl = "http://localhost:5051/external/tenantInternalAlarmList";
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
};

const payload = {
  serialNumber: "SN987654321",
  sgmModuleType: "RTU5024",
  modelDescription: "Internal Security Control Panel - Commercial Grade",
  accessDetails: {
    phoneNumber: "+27118765432",
    pin: "5678",
  },
  tenantId: "TENANT_TEST",
};

async function run() {
  // Create
  let res = await fetch(baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  let json = await res.json();
  assert(json.success, "Create failed");
  const id = json.data.id;
  console.log("Create: ", json);

  // Get by ID
  res = await fetch(`${baseUrl}/${id}`, { headers });
  json = await res.json();
  assert(json.success, "Get by ID failed");
  console.log("Get by ID: ", json);

  // Update
  res = await fetch(`${baseUrl}/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ modelDescription: "Updated Description" }),
  });
  json = await res.json();
  assert(json.success, "Update failed");
  console.log("Update: ", json);

  // List all
  res = await fetch(`${baseUrl}/list`, { headers });
  json = await res.json();
  assert(json.success, "List failed");
  console.log("List: ", json);
}

run().catch(console.error);
