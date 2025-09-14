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
  "/internal/role-mappings",
  authenticateJWT,
  checkPermissions("role.read"),
  getRoleMappings
);

// Enhanced search
router.get(
  "/internal/role-mappings/search",
  authenticateJWT,
  checkPermissions("role.read"),
  searchRoleMappings
);

// Bulk ops
router.post(
  "/internal/role-mappings/bulk",
  authenticateJWT,
  checkPermissions("role.update", "system.manage"),
  bulkRoleMappings
);

// Export
router.get(
  "/internal/role-mappings/export",
  authenticateJWT,
  checkPermissions("role.read"),
  exportRoleMappings
);

// Stats
router.get(
  "/internal/role-mappings/stats",
  authenticateJWT,
  checkPermissions("role.read"),
  getRoleMappingsStats
);

// Update all role mappings
router.put(
  "/internal/role-mappings",
  authenticateJWT,
  checkPermissions("role.update", "system.manage"),
  updateRoleMappings
);

// Reload mappings from source
router.post(
  "/internal/role-mappings/reload",
  authenticateJWT,
  checkPermissions("role.update", "system.manage"),
  reloadRoleMappings
);

// Add a single mapping
router.post(
  "/internal/role-mapping",
  authenticateJWT,
  checkPermissions("role.create"),
  addRoleMapping
);

// Get role mapping by ID
router.get(
  "/internal/role-mapping/:id",
  authenticateJWT,
  checkPermissions("role.read"),
  getRoleMappingById
);

// Update role mapping by ID
router.put(
  "/internal/role-mapping/:id",
  authenticateJWT,
  checkPermissions("role.update"),
  updateRoleMappingById
);

// Partially update role mapping by ID
router.patch(
  "/internal/role-mapping/:id",
  authenticateJWT,
  checkPermissions("role.update"),
  patchRoleMappingById
);

// Remove a mapping
router.delete(
  "/internal/role-mapping/:roleName",
  authenticateJWT,
  checkPermissions("role.delete"),
  removeRoleMapping
);

export default router;
