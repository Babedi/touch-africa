/**
 * Permission derivation utilities
 * Roles are treated strictly as containers of permissions.
 * This helper converts role labels/codes into a flattened unique permissions array.
 */

import roleMappingConfig from "../config/role-mappings.config.js";
import { getRolePermissionsService } from "../modules/internal/role/role.service.js";

/**
 * Derive permissions from role labels/codes.
 * - Maps friendly role names to role codes via roleMappingConfig
 * - Looks up each role's permissions from internalRoles (role.service)
 * - Returns a unique, flattened list of permissions
 *
 * @param {string[]|undefined|null} roles
 * @returns {Promise<string[]>}
 */
export async function derivePermissionsFromRoles(roles) {
  if (!Array.isArray(roles) || roles.length === 0) return [];

  // Ensure mappings are available (defaults if not initialized elsewhere)
  try {
    // initialize() is idempotent; ignore failures and fall back to defaults
    await roleMappingConfig.initialize?.();
  } catch {}

  const uniquePerms = new Set();
  for (const r of roles) {
    if (!r) continue;
    const roleCode = roleMappingConfig.getMapping(r) || r; // allow code passthrough
    try {
      const perms = await getRolePermissionsService(roleCode);
      if (Array.isArray(perms)) {
        perms.filter(Boolean).forEach((p) => uniquePerms.add(p));
      }
    } catch (e) {
      // If a role has no backing document, skip silently
    }
  }

  return Array.from(uniquePerms);
}

export default { derivePermissionsFromRoles };
