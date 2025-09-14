import express from "express";
import { authenticateJWT } from "../../../../middleware/auth.middleware.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../../middleware/permission.middleware.js";
import {
  createExternalPermissionController,
  getExternalPermissionController,
  updateExternalPermissionController,
  patchExternalPermissionController,
  deleteExternalPermissionController,
  getAllExternalPermissionsController,
  searchExternalPermissionsController,
  bulkExternalPermissionsController,
  exportExternalPermissionsController,
  getExternalPermissionsStatsController,
} from "./permission.controller.js";

const router = express.Router();

// Authorization roles for external permission operations
// Permissions defined in route handlers directly

// POST /:tenantId/permissions - Create new permission
router.post(
  "/:tenantId/permissions",
  authenticateJWT,
  checkPermissions("tenant.permission.create"),
  createExternalPermissionController
);

// GET /:tenantId/permissions - Get all permissions
router.get(
  "/:tenantId/permissions",
  authenticateJWT,
  checkPermissions("tenant.permission.read"),
  getAllExternalPermissionsController
);

// GET /:tenantId/permissions/search - Search permissions
router.get(
  "/:tenantId/permissions/search",
  authenticateJWT,
  checkPermissions("tenant.permission.read"),
  searchExternalPermissionsController
);

// POST /:tenantId/permissions/bulk - Bulk operations
router.post(
  "/:tenantId/permissions/bulk",
  authenticateJWT,
  checkPermissions("tenant.permission.update"),
  bulkExternalPermissionsController
);

// GET /:tenantId/permissions/export - Export permissions
router.get(
  "/:tenantId/permissions/export",
  authenticateJWT,
  checkPermissions("tenant.permission.read"),
  exportExternalPermissionsController
);

// GET /:tenantId/permissions/stats - Permission statistics
router.get(
  "/:tenantId/permissions/stats",
  authenticateJWT,
  checkPermissions("tenant.permission.read"),
  getExternalPermissionsStatsController
);

// GET /:tenantId/permissions/:id - Get permission by ID
router.get(
  "/:tenantId/permissions/:id",
  authenticateJWT,
  checkPermissions("tenant.permission.read"),
  getExternalPermissionController
);

// PUT /:tenantId/permissions/:id - Update permission by ID
router.put(
  "/:tenantId/permissions/:id",
  authenticateJWT,
  checkPermissions("tenant.permission.update"),
  updateExternalPermissionController
);

// PATCH /:tenantId/permissions/:id - Partially update permission by ID
router.patch(
  "/:tenantId/permissions/:id",
  authenticateJWT,
  checkPermissions("tenant.permission.update"),
  patchExternalPermissionController
);

// DELETE /:tenantId/permissions/:id - Delete permission by ID
router.delete(
  "/:tenantId/permissions/:id",
  authenticateJWT,
  checkPermissions("tenant.permission.delete"),
  deleteExternalPermissionController
);

export default router;
