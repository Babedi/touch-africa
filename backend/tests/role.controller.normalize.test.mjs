import assert from "assert";
import { normalizeRolePermissions } from "../modules/internal/role/role.controller.js";

// Basic unit tests for permission normalization logic
function run() {
  const role = {
    id: "r1",
    roleName: "Test",
    permissions: [
      "person.view",
      { id: "person.create", name: "Create Person" },
      { code: "role.manage" },
      { permission: "tenant.admin" },
      null,
    ],
  };
  const normalized = normalizeRolePermissions(role);
  assert.ok(
    Array.isArray(normalized.permissions),
    "permissions should be array"
  );
  const ids = normalized.permissions.map((p) => p.id);
  assert.deepEqual(
    ids.sort(),
    ["person.create", "person.view", "role.manage", "tenant.admin"].sort()
  );
  normalized.permissions.forEach((p) => {
    assert.ok(p.code && p.name, "each permission has code and name");
  });
  // Ensure original role not mutated structurally (shallow)
  assert.notStrictEqual(normalized, role, "returned role is a clone");
  console.log("role.controller.normalize tests passed");
}

run();
