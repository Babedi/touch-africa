import express from "express";
import { authenticateJWT } from "../../../../middleware/auth.middleware.js";
import {
  advancedListQuery,
  searchQuery,
  exportQuery,
} from "../../../../middleware/query.middleware.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../../middleware/permission.middleware.js";
import {
  createExternalAdminHandler,
  getCurrentAdminHandler,
  getExternalAdminByIdHandler,
  updateExternalAdminByIdHandler,
  patchExternalAdminByIdHandler,
  deleteExternalAdminByIdHandler,
  listExternalAdminsHandler,
  searchExternalAdminsHandler,
  bulkExternalAdminsHandler,
  exportExternalAdminsHandler,
  getExternalAdminsStatsHandler,
  loginExternalAdminHandler,
  logoutExternalAdminHandler,
  activateExternalAdminHandler,
  deactivateExternalAdminHandler,
} from "./admin.controller.js";

const router = express.Router();

// Not protected routes
router.post("/:tenantId/admins/login", loginExternalAdminHandler);
router.post("/:tenantId/admins/logout", logoutExternalAdminHandler);

// Protected routes
router.post(
  "/:tenantId/admins",
  authenticateJWT,
  checkPermissions("tenant.admin.create", "all.access"),
  createExternalAdminHandler
);

router.get(
  "/:tenantId/admins/me",
  authenticateJWT,
  checkPermissions("tenant.admin.read", "all.access"),
  getCurrentAdminHandler
);

router.get(
  "/:tenantId/admins/search",
  authenticateJWT,
  checkPermissions("tenant.admin.read", "all.access"),
  searchQuery([
    "personalInfo.firstName",
    "personalInfo.lastName",
    "personalInfo.fullName",
    "personalInfo.email",
    "personalInfo.cellNumber",
    "roles",
    "status",
  ]),
  searchExternalAdminsHandler
);

router.get(
  "/:tenantId/admins/export",
  authenticateJWT,
  checkPermissions("tenant.admin.read", "all.access"),
  exportQuery({
    sortFields: [
      "personalInfo.firstName",
      "personalInfo.lastName",
      "personalInfo.email",
      "roles",
      "status",
    ],
    filterFields: ["status", "roles", "personalInfo.email"],
  }),
  exportExternalAdminsHandler
);

router.get(
  "/:tenantId/admins/stats",
  authenticateJWT,
  checkPermissions("tenant.admin.read", "all.access"),
  getExternalAdminsStatsHandler
);

router.post(
  "/:tenantId/admins/bulk",
  authenticateJWT,
  checkPermissions(
    "tenant.admin.create",
    "tenant.admin.update",
    "tenant.admin.delete",
    "all.access"
  ),
  bulkExternalAdminsHandler
);

router.get(
  "/:tenantId/admins",
  authenticateJWT,
  checkPermissions("tenant.admin.read", "all.access"),
  advancedListQuery({
    sortFields: [
      "personalInfo.firstName",
      "personalInfo.lastName",
      "personalInfo.email",
      "createdAt",
      "updatedAt",
    ],
    filterFields: ["status", "roles", "personalInfo.email"],
    searchFields: [
      "personalInfo.firstName",
      "personalInfo.lastName",
      "personalInfo.fullName",
      "personalInfo.email",
    ],
    expands: ["roles"],
  }),
  listExternalAdminsHandler
);

router.get(
  "/:tenantId/admins/:id",
  authenticateJWT,
  checkPermissions("tenant.admin.read", "all.access"),
  getExternalAdminByIdHandler
);

router.put(
  "/:tenantId/admins/:id",
  authenticateJWT,
  checkPermissions("tenant.admin.update", "all.access"),
  updateExternalAdminByIdHandler
);

router.patch(
  "/:tenantId/admins/:id",
  authenticateJWT,
  checkPermissions("tenant.admin.update", "all.access"),
  patchExternalAdminByIdHandler
);

router.delete(
  "/:tenantId/admins/:id",
  authenticateJWT,
  checkPermissions("tenant.admin.delete", "all.access"),
  deleteExternalAdminByIdHandler
);

router.put(
  "/:tenantId/admins/:id/activate",
  authenticateJWT,
  checkPermissions("tenant.admin.update", "all.access"),
  activateExternalAdminHandler
);

router.put(
  "/:tenantId/admins/:id/deactivate",
  authenticateJWT,
  checkPermissions("tenant.admin.update", "all.access"),
  deactivateExternalAdminHandler
);

export default router;
