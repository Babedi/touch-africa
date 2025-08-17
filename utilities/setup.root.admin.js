// ===================================================
// setup.root.admin.js — one-time seeder for the root admin
// ===================================================
import "dotenv/config";
import { db } from "../services/firestore.client.js";
import { createRootAdmin } from "../modules/internal/root.admin/root.admin.service.js";
import fs from "fs";
import path from "path";

function parseArgs(argv) {
  const out = { file: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--file" || a === "-f") {
      out.file = argv[i + 1] || null;
      i++;
    }
  }
  return out;
}

async function loadPayloadFromFile(filePath) {
  const abs = path.resolve(process.cwd(), filePath);
  const text = fs.readFileSync(abs, "utf8");
  const json = JSON.parse(text);
  return json;
}

async function setupRootAdmin() {
  const { file } = parseArgs(process.argv);
  let email = process.env.ROOT_ADMIN_EMAIL || "";
  let password = process.env.ROOT_ADMIN_PASSWORD || "";
  let title = process.env.ROOT_ADMIN_TITLE || "Mr";
  let names = process.env.ROOT_ADMIN_NAMES || "Root Admin";
  let surname = process.env.ROOT_ADMIN_SURNAME || "User";

  let payloadFromFile = null;
  if (file) {
    try {
      payloadFromFile = await loadPayloadFromFile(file);
      email = payloadFromFile?.accessDetails?.email || email;
      password = payloadFromFile?.accessDetails?.password || password;
      title = payloadFromFile?.title || title;
      names = payloadFromFile?.names || names;
      surname = payloadFromFile?.surname || surname;
    } catch (e) {
      console.error("Failed to load payload file:", e?.message || e);
      process.exit(1);
    }
  }

  if (!email || !password) {
    console.error("Missing ROOT_ADMIN_EMAIL or ROOT_ADMIN_PASSWORD in .env");
    process.exit(1);
  }
  if (!/@neighbourguard\.co\.za$/i.test(email)) {
    console.error("Email must end with @neighbourguard.co.za");
    process.exit(1);
  }

  // Check if root already exists at subcollection path
  const docRef = db
    .collection("services")
    .doc("neighbourGuardService")
    .collection("admins")
    .doc("root");
  const snap = await docRef.get();
  if (snap.exists) {
    console.log("Root admin already exists. Aborting setup.");
    console.log("Path: /services/neighbourGuardService/admins/root");
    process.exit(0);
  }

  const payload = {
    id: "root",
    roles: ["internalSuperAdmin", "root"],
    title,
    names,
    surname,
    accessDetails: { email, password, lastLogin: [] },
    account: { isActive: { value: true, changes: [] } },
  };

  try {
    const created = await createRootAdmin(payload, "setup.root.admin");
    console.log("Root admin created.");
    console.log("Email:", created?.accessDetails?.email);
    console.log("Roles:", created?.roles);
    console.log("Path: /services/neighbourGuardService/admins/root");
  } catch (e) {
    console.error("Failed to create root admin:", e?.message || e);
    process.exit(1);
  }
}

setupRootAdmin();
