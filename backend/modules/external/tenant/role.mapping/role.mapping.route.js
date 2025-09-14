import express from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import { checkPermissions } from "../../../middleware/permission.middleware.js";
import {
  getRoleMappings,
  searchRoleMappings,
  bulkRoleMappings,
  exportRoleMappings,
  getRoleMappingsStats,
  updateRoleMappings,
  reloadRoleMappings,
  addRoleMapping,
  removeRoleMapping,
  getRoleMappingById,
  updateRoleMappingById,
  patchRoleMappingById,
} from "./role.mapping.controller.js";

const router = express.Router();

// Get current role mappings
router.get(
  "/:tenantId/role-mappings",
  authenticateJWT,
  checkPermissions("tenant.role.mapping.read"),
  getRoleMappings
);

// Enhanced search
router.get(
  "/:tenantId/role-mappings/search",
  authenticateJWT,
  checkPermissions("tenant.role.mapping.read"),
  searchRoleMappings
);

// Bulk ops
router.post(
  "/:tenantId/role-mappings/bulk",
  authenticateJWT,
  checkPermissions("tenant.role.mapping.update", "system.manage"),
  bulkRoleMappings
);

// Export
router.get(
  "/:tenantId/role-mappings/export",
  authenticateJWT,
  checkPermissions("tenant.role.mapping.read"),
  exportRoleMappings
);

// Stats
router.get(
  "/:tenantId/role-mappings/stats",
  authenticateJWT,
  checkPermissions("tenant.role.mapping.read"),
  getRoleMappingsStats
);

// Update all role mappings
router.put(
  "/:tenantId/role-mappings",
  authenticateJWT,
  checkPermissions("tenant.role.mapping.update", "system.manage"),
  updateRoleMappings
);

// Reload mappings from source
router.post(
  "/:tenantId/role-mappings/reload",
  authenticateJWT,
  checkPermissions("tenant.role.mapping.update", "system.manage"),
  reloadRoleMappings
);

// Add a single mapping
router.post(
  "/:tenantId/role-mapping",
  authenticateJWT,
  checkPermissions("tenant.role.mapping.create"),
  addRoleMapping
);

// Get role mapping by ID
router.get(
  "/:tenantId/role-mapping/:id",
  authenticateJWT,
  checkPermissions("tenant.role.mapping.read"),
  getRoleMappingById
);

// Update role mapping by ID
router.put(
  "/:tenantId/role-mapping/:id",
  authenticateJWT,
  checkPermissions("tenant.role.mapping.update"),
  updateRoleMappingById
);

// Partially update role mapping by ID
router.patch(
  "/:tenantId/role-mapping/:id",
  authenticateJWT,
  checkPermissions("tenant.role.mapping.update"),
  patchRoleMappingById
);

// Remove a mapping
router.delete(
  "/:tenantId/role-mapping/:roleName",
  authenticateJWT,
  checkPermissions("tenant.role.mapping.delete"),
  removeRoleMapping
);

export default router;
