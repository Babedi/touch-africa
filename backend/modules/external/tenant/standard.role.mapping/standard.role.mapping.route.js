import express from "express";
import { authenticateJWT } from "../../../../middleware/auth.middleware.js";
import { checkPermissions } from "../../../../middleware/permission.middleware.js";
import {
  getStandardRoleMappings,
  searchStandardRoleMappings,
  bulkStandardRoleMappings,
  exportStandardRoleMappings,
  getStandardRoleMappingsStats,
  updateStandardRoleMappings,
  reloadStandardRoleMappings,
  addStandardRoleMapping,
  removeStandardRoleMapping,
  getStandardRoleMappingById,
  updateStandardRoleMappingById,
  patchStandardRoleMappingById,
} from "./standard.role.mapping.controller.js";

const router = express.Router();

// Get current standard role mappings
router.get(
  "/",
  authenticateJWT,
  checkPermissions("standard.role.mapping.read"),
  getStandardRoleMappings
);

// Enhanced search
router.get(
  "/search",
  authenticateJWT,
  checkPermissions("standard.role.mapping.read"),
  searchStandardRoleMappings
);

// Bulk ops
router.post(
  "/bulk",
  authenticateJWT,
  checkPermissions("standard.role.mapping.update"),
  bulkStandardRoleMappings
);

// Export
router.get(
  "/export",
  authenticateJWT,
  checkPermissions("standard.role.mapping.read"),
  exportStandardRoleMappings
);

// Stats
router.get(
  "/stats",
  authenticateJWT,
  checkPermissions("standard.role.mapping.read"),
  getStandardRoleMappingsStats
);

// Update all standard role mappings
router.put(
  "/update",
  authenticateJWT,
  checkPermissions("standard.role.mapping.update"),
  updateStandardRoleMappings
);

// Reload mappings from source
router.post(
  "/reload",
  authenticateJWT,
  checkPermissions("standard.role.mapping.update"),
  reloadStandardRoleMappings
);

// Add a single mapping
router.post(
  "/single",
  authenticateJWT,
  checkPermissions("standard.role.mapping.create"),
  addStandardRoleMapping
);

// Get standard role mapping by ID
router.get(
  "/:id",
  authenticateJWT,
  checkPermissions("standard.role.mapping.read"),
  getStandardRoleMappingById
);

// Update standard role mapping by ID
router.put(
  "/:id",
  authenticateJWT,
  checkPermissions("standard.role.mapping.update"),
  updateStandardRoleMappingById
);

// Partially update standard role mapping by ID
router.patch(
  "/:id",
  authenticateJWT,
  checkPermissions("standard.role.mapping.update"),
  patchStandardRoleMappingById
);

// Remove a mapping
router.delete(
  "/by-role/:roleName",
  authenticateJWT,
  checkPermissions("standard.role.mapping.delete"),
  removeStandardRoleMapping
);

export default router;
