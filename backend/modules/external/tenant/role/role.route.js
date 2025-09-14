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
  createExternalRoleHandler,
  getExternalRoleByIdHandler,
  updateExternalRoleByIdHandler,
  deleteExternalRoleByIdHandler,
  listExternalRolesHandler,
  patchExternalRoleHandler,
  searchExternalRolesHandler,
  bulkExternalRolesHandler,
  exportExternalRolesHandler,
  getExternalRolesStatsHandler,
} from "./role.controller.js";

const router = express.Router();

// Read operations - require authentication and role.read permission
router.get(
  "/:tenantId/roles",
  authenticateJWT,
  checkPermissions("tenant.role.read"),
  advancedListQuery({
    sortFields: ["roleName", "roleCode", "isSystem", "isActive"],
    searchFields: ["roleName", "roleCode", "description"],
  }),
  listExternalRolesHandler
);

router.get(
  "/:tenantId/roles/search",
  authenticateJWT,
  checkPermissions("tenant.role.read"),
  advancedListQuery({
    sortFields: ["roleName", "roleCode", "isSystem", "isActive"],
    searchFields: ["roleName", "roleCode", "description"],
  }),
  searchExternalRolesHandler
);

router.get(
  "/:tenantId/roles/export",
  authenticateJWT,
  checkPermissions("tenant.role.read"),
  validateExport,
  exportExternalRolesHandler
);

router.get(
  "/:tenantId/roles/stats",
  authenticateJWT,
  checkPermissions("tenant.role.read"),
  getExternalRolesStatsHandler
);

router.get(
  "/:tenantId/roles/:id",
  authenticateJWT,
  checkPermissions("tenant.role.read"),
  getExternalRoleByIdHandler
);

// Write operations - require authentication and role.create permission
router.post(
  "/:tenantId/roles",
  authenticateJWT,
  checkPermissions("tenant.role.create"),
  createExternalRoleHandler
);

router.post(
  "/:tenantId/roles/bulk",
  authenticateJWT,
  checkPermissions("tenant.role.create"),
  validateBulkOperation,
  bulkExternalRolesHandler
);

// Update operations - require authentication and role.update permission
router.put(
  "/:tenantId/roles/:id",
  authenticateJWT,
  checkPermissions("tenant.role.update"),
  updateExternalRoleByIdHandler
);

// Partial update operations - require authentication and role.update permission
router.patch(
  "/:tenantId/roles/:id",
  authenticateJWT,
  checkPermissions("tenant.role.update"),
  patchExternalRoleHandler
);

// Delete operations - require authentication and role.delete permission
router.delete(
  "/:tenantId/roles/:id",
  authenticateJWT,
  checkPermissions("tenant.role.delete"),
  deleteExternalRoleByIdHandler
);

export default router;
