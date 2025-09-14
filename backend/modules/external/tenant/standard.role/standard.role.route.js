import express from "express";
import { authenticateJWT } from "../../../../middleware/auth.middleware.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../../middleware/permission.middleware.js";
import {
  validatePagination,
  validateSearch,
  validateBulkOperation,
  validateExport,
  advancedListQuery,
} from "../../../../middleware/query.middleware.js";
import {
  createStandardRoleHandler,
  getStandardRoleByIdHandler,
  updateStandardRoleByIdHandler,
  deleteStandardRoleByIdHandler,
  listStandardRolesHandler,
  patchStandardRoleHandler,
  searchStandardRolesHandler,
  bulkStandardRolesHandler,
  exportStandardRolesHandler,
  getStandardRolesStatsHandler,
} from "./standard.role.controller.js";

const router = express.Router();

// Read operations - require authentication and standard role.read permission
router.get(
  "/",
  authenticateJWT,
  checkPermissions("standard.role.read"),
  advancedListQuery({
    sortFields: ["roleName", "roleCode", "isSystem", "isActive"],
    searchFields: ["roleName", "roleCode", "description"],
  }),
  listStandardRolesHandler
);

router.get(
  "/search",
  authenticateJWT,
  checkPermissions("standard.role.read"),
  advancedListQuery({
    sortFields: ["roleName", "roleCode", "isSystem", "isActive"],
    searchFields: ["roleName", "roleCode", "description"],
  }),
  searchStandardRolesHandler
);

router.get(
  "/export",
  authenticateJWT,
  checkPermissions("standard.role.read"),
  validateExport,
  exportStandardRolesHandler
);

router.get(
  "/stats",
  authenticateJWT,
  checkPermissions("standard.role.read"),
  getStandardRolesStatsHandler
);

router.get(
  "/:id",
  authenticateJWT,
  checkPermissions("standard.role.read"),
  getStandardRoleByIdHandler
);

// Write operations - require authentication and standard role.create permission
router.post(
  "/",
  authenticateJWT,
  checkPermissions("standard.role.create"),
  createStandardRoleHandler
);

router.post(
  "/bulk",
  authenticateJWT,
  checkPermissions("standard.role.create"),
  validateBulkOperation,
  bulkStandardRolesHandler
);

// Update operations - require authentication and standard role.update permission
router.put(
  "/:id",
  authenticateJWT,
  checkPermissions("standard.role.update"),
  updateStandardRoleByIdHandler
);

// Partial update operations - require authentication and standard role.update permission
router.patch(
  "/:id",
  authenticateJWT,
  checkPermissions("standard.role.update"),
  patchStandardRoleHandler
);

// Delete operations - require authentication and standard role.delete permission
router.delete(
  "/:id",
  authenticateJWT,
  checkPermissions("standard.role.delete"),
  deleteStandardRoleByIdHandler
);

export default router;
