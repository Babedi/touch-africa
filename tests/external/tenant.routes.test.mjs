import fetch from "node-fetch";
import assert from "assert";
import fs from "fs";

const token = fs.readFileSync("token.txt", "utf8").trim();
const baseUrl = "http://localhost:5051/external/tenant";
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
};

const payload = {
  ussdRefId: 1,
  activationResponseBlockName: "Sandton Office Park Security Response Block",
  address: {
    locality: "Sandton",
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
    afrikaans: {
      menuItem1: "Lewe in Gevaar",
      menuItem2: "Eiendom in Gevaar",
      menuItem3: "Albei in Gevaar",
      menuItem4: "",
      menuItem5: "",
    },
    // ...other languages as needed
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
    body: JSON.stringify({ activationResponseBlockName: "Updated Block" }),
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
