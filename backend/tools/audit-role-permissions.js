#!/usr/bin/env node
/**
 * Audit internal roles' permission arrays for module.action format compliance.
 * Now strictly enforces module.action format without legacy migration.
 * Usage:
 *   node backend/tools/audit-role-permissions.js
 */
import { db } from "../services/firestore.client.js";

const COLLECTION_PATH = "touchAfrica/southAfrica/internalRoles";

// Module.action format validation regex
const MODULE_ACTION_REGEX =
  /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)*\.[a-zA-Z][a-zA-Z0-9]*$/;

function isValidModuleActionFormat(permission) {
  return MODULE_ACTION_REGEX.test(permission);
}

function normalize(list) {
  return Array.from(new Set(list.filter(Boolean)));
}

function findInvalidPermissions(perms) {
  return perms.filter((p) => !isValidModuleActionFormat(String(p)));
}

(async () => {
  console.log(
    "🔍 Auditing internal roles for module.action format compliance in:",
    COLLECTION_PATH
  );
  let roles = [];
  try {
    const snap = await db.collection(COLLECTION_PATH).get();
    roles = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error(
      "✖ Failed to read roles from Firestore:",
      err?.message || err
    );
    console.error(
      "Ensure backend/secrets/serviceAccountKey.json is valid and Firestore is reachable."
    );
    process.exit(1);
  }

  let invalidCount = 0;
  const issues = [];

  for (const r of roles) {
    const perms = Array.isArray(r.permissions) ? r.permissions : [];
    const invalidPerms = findInvalidPermissions(perms);
    if (invalidPerms.length > 0) {
      invalidCount++;
      issues.push({
        id: r.id,
        roleName: r.roleName,
        invalidPermissions: invalidPerms,
        allPermissions: perms,
      });
    }
  }

  if (invalidCount === 0) {
    console.log("✅ All roles have valid module.action format permissions!");
  } else {
    console.log(
      `❌ Found ${invalidCount} role(s) with invalid permission formats:`
    );
    for (const issue of issues) {
      console.log(`\n🔸 Role: ${issue.roleName} (${issue.id})`);
      console.log(
        `   Invalid permissions: ${issue.invalidPermissions.join(", ")}`
      );
      console.log(`   All permissions: ${issue.allPermissions.join(", ")}`);
      console.log(
        `   ⚠️  Please update these to use module.action format (e.g., 'role.read', 'admin.manage')`
      );
    }
  }

  // Check for required admin permissions
  const REQUIRED_ADMIN = ["admin.read", "admin.update"];
  const missingAdmin = roles
    .map((r) => ({
      id: r.id,
      roleName: r.roleName,
      perms: Array.isArray(r.permissions) ? r.permissions : [],
    }))
    .map(({ id, roleName, perms }) => ({
      id,
      roleName,
      missing: REQUIRED_ADMIN.filter((p) => !perms.includes(p)),
    }))
    .filter((x) => x.missing.length);

  if (missingAdmin.length) {
    console.log("\n⚠️  Roles missing required admin permissions:");
    for (const m of missingAdmin) {
      console.log(`- ${m.roleName} (${m.id}): missing ${m.missing.join(", ")}`);
    }
  } else {
    console.log(
      "\n✅ All roles contain required admin permissions (admin.read, admin.update)."
    );
  }

  console.log("\n📋 Summary:");
  console.log(`   Total roles: ${roles.length}`);
  console.log(`   Valid format: ${roles.length - invalidCount}`);
  console.log(`   Invalid format: ${invalidCount}`);
  console.log(`   Missing admin perms: ${missingAdmin.length}`);

  if (invalidCount > 0) {
    console.log(
      "\n💡 To fix invalid permissions, manually update them in the database or through the admin interface."
    );
    console.log(
      "   All permissions must follow module.action format (e.g., 'role.read', 'admin.manage', 'user.create')"
    );
  }
})();
