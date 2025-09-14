import express from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../middleware/permission.middleware.js";
import {
  validatePagination,
  validateSearch,
  validateBulkOperation,
  validateExport,
  advancedListQuery,
} from "../../../middleware/query.middleware.js";
import {
  createInternalRoleHandler,
  getInternalRoleByIdHandler,
  updateInternalRoleByIdHandler,
  deleteInternalRoleByIdHandler,
  listInternalRolesHandler,
  patchInternalRoleHandler,
  searchInternalRolesHandler,
  bulkInternalRolesHandler,
  exportInternalRolesHandler,
  getInternalRolesStatsHandler,
} from "./role.controller.js";

const router = express.Router();

// Read operations - require authentication and role.read permission
router.get(
  "/internal/roles",
  authenticateJWT,
  checkPermissions("role.read", "all.access"),
  advancedListQuery({
    sortFields: ["roleName", "roleCode", "isSystem", "isActive"],
    searchFields: ["roleName", "roleCode", "description"],
  }),
  listInternalRolesHandler
);

router.get(
  "/internal/roles/search",
  authenticateJWT,
  checkPermissions("role.read", "all.access"),
  advancedListQuery({
    sortFields: ["roleName", "roleCode", "isSystem", "isActive"],
    searchFields: ["roleName", "roleCode", "description"],
  }),
  searchInternalRolesHandler
);

router.get(
  "/internal/roles/export",
  authenticateJWT,
  checkPermissions("role.read", "all.access"),
  validateExport,
  exportInternalRolesHandler
);

router.get(
  "/internal/roles/stats",
  authenticateJWT,
  checkPermissions("role.read", "all.access"),
  getInternalRolesStatsHandler
);

router.get(
  "/internal/roles/:id",
  authenticateJWT,
  checkPermissions("role.read", "all.access"),
  getInternalRoleByIdHandler
);

// Write operations - require authentication and role.create permission
router.post(
  "/internal/roles",
  authenticateJWT,
  checkPermissions("role.create", "all.access"),
  createInternalRoleHandler
);

router.post(
  "/internal/roles/bulk",
  authenticateJWT,
  checkPermissions("role.create", "all.access"),
  validateBulkOperation,
  bulkInternalRolesHandler
);

// Update operations - require authentication and role.update permission
router.put(
  "/internal/roles/:id",
  authenticateJWT,
  checkPermissions("role.update", "all.access"),
  updateInternalRoleByIdHandler
);

// Partial update operations - require authentication and role.update permission
router.patch(
  "/internal/roles/:id",
  authenticateJWT,
  checkPermissions("role.update", "all.access"),
  patchInternalRoleHandler
);

// Delete operations - require authentication and role.delete permission
router.delete(
  "/internal/roles/:id",
  authenticateJWT,
  checkPermissions("role.delete", "all.access"),
  deleteInternalRoleByIdHandler
);

export default router;
