import express from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../middleware/permission.middleware.js";
import {
  createInternalPermissionController,
  getInternalPermissionController,
  updateInternalPermissionController,
  patchInternalPermissionController,
  deleteInternalPermissionController,
  getAllInternalPermissionsController,
  searchInternalPermissionsController,
  bulkInternalPermissionsController,
  exportInternalPermissionsController,
  getInternalPermissionsStatsController,
} from "./permission.controller.js";

const router = express.Router();

// Authorization roles for internal permission operations
// Permissions defined in route handlers directly

// POST /internal/permissions - Create new permission
router.post(
  "/internal/permissions",
  authenticateJWT,
  checkPermissions("admin.create"),
  createInternalPermissionController
);

// GET /internal/permissions - Get all permissions
router.get(
  "/internal/permissions",
  authenticateJWT,
  checkPermissions("admin.read"),
  getAllInternalPermissionsController
);

// GET /internal/permissions/search - Search permissions
router.get(
  "/internal/permissions/search",
  authenticateJWT,
  checkPermissions("admin.read"),
  searchInternalPermissionsController
);

// POST /internal/permissions/bulk - Bulk operations
router.post(
  "/internal/permissions/bulk",
  authenticateJWT,
  checkPermissions("admin.update"),
  bulkInternalPermissionsController
);

// GET /internal/permissions/export - Export permissions
router.get(
  "/internal/permissions/export",
  authenticateJWT,
  checkPermissions("admin.read"),
  exportInternalPermissionsController
);

// GET /internal/permissions/stats - Permission statistics
router.get(
  "/internal/permissions/stats",
  authenticateJWT,
  checkPermissions("admin.read"),
  getInternalPermissionsStatsController
);

// GET /internal/permissions/:id - Get permission by ID
router.get(
  "/internal/permissions/:id",
  authenticateJWT,
  checkPermissions("admin.read"),
  getInternalPermissionController
);

// PUT /internal/permissions/:id - Update permission by ID
router.put(
  "/internal/permissions/:id",
  authenticateJWT,
  checkPermissions("admin.update"),
  updateInternalPermissionController
);

// PATCH /internal/permissions/:id - Partially update permission by ID
router.patch(
  "/internal/permissions/:id",
  authenticateJWT,
  checkPermissions("admin.update"),
  patchInternalPermissionController
);

// DELETE /internal/permissions/:id - Delete permission by ID
router.delete(
  "/internal/permissions/:id",
  authenticateJWT,
  checkPermissions("admin.delete"),
  deleteInternalPermissionController
);

export default router;
