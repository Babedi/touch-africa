import express from "express";
import { authenticateJWT } from "../../../../middleware/auth.middleware.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../../middleware/permission.middleware.js";
import {
  createStandardPermissionController,
  getStandardPermissionController,
  updateStandardPermissionController,
  patchStandardPermissionController,
  deleteStandardPermissionController,
  getAllStandardPermissionsController,
  searchStandardPermissionsController,
  bulkStandardPermissionsController,
  exportStandardPermissionsController,
  getStandardPermissionsStatsController,
} from "./standard.permission.controller.js";

const router = express.Router();

// Authorization roles for standard permission operations
// Permissions defined in route handlers directly

// POST / - Create new standard permission
router.post(
  "/",
  authenticateJWT,
  checkPermissions("standard.permission.create"),
  createStandardPermissionController
);

// GET / - Get all standard permissions
router.get(
  "/",
  authenticateJWT,
  checkPermissions("standard.permission.read"),
  getAllStandardPermissionsController
);

// GET /search - Search standard permissions
router.get(
  "/search",
  authenticateJWT,
  checkPermissions("standard.permission.read"),
  searchStandardPermissionsController
);

// POST /bulk - Bulk operations
router.post(
  "/bulk",
  authenticateJWT,
  checkPermissions("standard.permission.update"),
  bulkStandardPermissionsController
);

// GET /export - Export standard permissions
router.get(
  "/export",
  authenticateJWT,
  checkPermissions("standard.permission.read"),
  exportStandardPermissionsController
);

// GET /stats - Standard permission statistics
router.get(
  "/stats",
  authenticateJWT,
  checkPermissions("standard.permission.read"),
  getStandardPermissionsStatsController
);

// GET /:id - Get standard permission by ID
router.get(
  "/:id",
  authenticateJWT,
  checkPermissions("standard.permission.read"),
  getStandardPermissionController
);

// PUT /:id - Update standard permission by ID
router.put(
  "/:id",
  authenticateJWT,
  checkPermissions("standard.permission.update"),
  updateStandardPermissionController
);

// PATCH /:id - Partially update standard permission by ID
router.patch(
  "/:id",
  authenticateJWT,
  checkPermissions("standard.permission.update"),
  patchStandardPermissionController
);

// DELETE /:id - Delete standard permission by ID
router.delete(
  "/:id",
  authenticateJWT,
  checkPermissions("standard.permission.delete"),
  deleteStandardPermissionController
);

export default router;
