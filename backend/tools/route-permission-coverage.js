#!/usr/bin/env node
/**
 * Cross-check all permission strings used in routes against Firestore role coverage.
 * Lists any route permissions that no role currently possesses.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "../services/firestore.client.js";
const ARGV = new Set(process.argv.slice(2));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "modules");

const ROUTE_FILE_RE = /\.route\.(js|mjs|cjs)$/i;
const PERM_PATTERNS = [
  /checkPermissions\(\s*\[([^\]]+)\]/g, // checkPermissions(["a","b"]) or ['a','b']
  /checkPermissions\(\s*['"]([^'"]+)['"]/g, // checkPermissions('a')
  /checkAllPermissions\(\s*\[([^\]]+)\]/g,
  /checkAllPermissions\(\s*['"]([^'"]+)['"]/g,
  /authorize\(\s*['"]([^'"\)]+)['"]/g, // legacy (deprecated) authorize('...')
];

function collectRouteFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) collectRouteFiles(full, out);
    else if (ROUTE_FILE_RE.test(name)) out.push(full);
  }
  return out;
}

function extractPermsFromSource(src) {
  const found = new Set();
  for (const re of PERM_PATTERNS) {
    let m;
    const rx = new RegExp(re.source, "g");
    while ((m = rx.exec(src))) {
      const group = m[1];
      if (!group) continue;
      if (group.includes('"') || group.includes("'")) {
        // Likely an array "a","b"
        const items = group
          .split(/[,\n]/)
          .map((s) => s.replace(/['"\s]/g, "").trim())
          .filter(Boolean);
        items.forEach((p) => found.add(p));
      } else {
        found.add(group.trim());
      }
    }
  }
  return Array.from(found);
}

async function fetchAllRolePerms() {
  const COLLECTION_PATH = "touchAfrica/southAfrica/internalRoles";
  const snap = await db.collection(COLLECTION_PATH).get();
  const roles = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const all = new Set();
  for (const r of roles) {
    (r.permissions || []).forEach((p) => all.add(String(p)));
  }
  return { roles, all: Array.from(all).sort() };
}

(async () => {
  console.log("🔎 Scanning route permissions under:", ROOT);
  const files = collectRouteFiles(ROOT);
  const used = new Set();

  for (const f of files) {
    const src = fs.readFileSync(f, "utf8");
    extractPermsFromSource(src).forEach((p) => used.add(p));
  }

  const usedList = Array.from(used).sort();
  console.log(`Found ${usedList.length} unique permission strings in routes.`);

  let roles = [];
  let all = [];
  if (!ARGV.has("--routes-only")) {
    try {
      const res = await fetchAllRolePerms();
      roles = res.roles;
      all = res.all;
    } catch (err) {
      console.warn("⚠️ Could not fetch Firestore roles:", err?.message || err);
      console.warn(
        "Proceeding with route-only report. Re-run when Firestore is available."
      );
    }
  }

  if (all.length) {
    const have = new Set(all);
    const missing = usedList.filter((p) => !have.has(p));

    console.log("\nPermissions used in routes but not present in any role:");
    if (!missing.length) console.log("  ✔ None");
    else missing.forEach((p) => console.log("  -", p));

    console.log("\nRole coverage summary:");
    for (const r of roles) {
      console.log(`- ${r.id}: ${(r.permissions || []).length} permissions`);
    }
  } else {
    console.log("\nRoute permissions (unique):");
    usedList.forEach((p) => console.log("  -", p));
  }
})();
