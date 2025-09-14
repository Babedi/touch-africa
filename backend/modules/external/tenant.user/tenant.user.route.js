import express from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../middleware/permission.middleware.js";
import {
  createTenantUserHandler,
  getTenantUserByIdHandler,
  listTenantUsersHandler,
  updateTenantUserHandler,
  deleteTenantUserHandler,
  loginTenantUserHandler,
  patchTenantUserHandler,
  searchTenantUsersHandler,
  bulkTenantUsersHandler,
  exportTenantUsersHandler,
  getTenantUsersStatsHandler,
} from "./tenant.user.controller.js";

const router = express.Router();

// Not protected (per prompt for tenantUser): login/logout
router.post("/external/tenant-users/login", loginTenantUserHandler);
router.post("/external/tenant-users/logout", (_req, res) =>
  res.json({ success: true })
);

// Protected
router.post(
  "/external/tenant-users",
  authenticateJWT,
  checkPermissions("tenant.user.create"),
  createTenantUserHandler
);
router.get(
  "/external/tenant-users",
  authenticateJWT,
  checkPermissions("tenant.user.read"),
  listTenantUsersHandler
);

// Enhanced search
router.get(
  "/external/tenant-users/search",
  authenticateJWT,
  checkPermissions("tenant.user.read"),
  searchTenantUsersHandler
);

// Bulk ops
router.post(
  "/external/tenant-users/bulk",
  authenticateJWT,
  checkPermissions("tenant.user.update"),
  bulkTenantUsersHandler
);

// Export
router.get(
  "/external/tenant-users/export",
  authenticateJWT,
  checkPermissions("tenant.user.read"),
  exportTenantUsersHandler
);

// Stats
router.get(
  "/external/tenant-users/stats",
  authenticateJWT,
  checkPermissions("tenant.user.read"),
  getTenantUsersStatsHandler
);
router.get(
  "/external/tenant-users/:id",
  authenticateJWT,
  checkPermissions("tenant.user.read"),
  getTenantUserByIdHandler
);
router.put(
  "/external/tenant-users/:id",
  authenticateJWT,
  checkPermissions("tenant.user.update"),
  updateTenantUserHandler
);
router.patch(
  "/external/tenant-users/:id",
  authenticateJWT,
  checkPermissions("tenant.user.update"),
  patchTenantUserHandler
);
router.put(
  "/external/tenant-users/:id/activate",
  authenticateJWT,
  checkPermissions("tenant.user.update"),
  updateTenantUserHandler
);
router.put(
  "/external/tenant-users/:id/deactivate",
  authenticateJWT,
  checkPermissions("tenant.user.update"),
  updateTenantUserHandler
);
router.delete(
  "/external/tenant-users/:id",
  authenticateJWT,
  checkPermissions("tenant.user.delete"),
  deleteTenantUserHandler
);

export default router;
