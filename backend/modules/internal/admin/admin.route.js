import express from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import {
  advancedListQuery,
  searchQuery,
  exportQuery,
} from "../../../middleware/query.middleware.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../middleware/permission.middleware.js";
import {
  createInternalAdminHandler,
  getCurrentAdminHandler,
  getInternalAdminByIdHandler,
  updateInternalAdminByIdHandler,
  patchInternalAdminByIdHandler,
  deleteInternalAdminByIdHandler,
  listInternalAdminsHandler,
  searchInternalAdminsHandler,
  bulkInternalAdminsHandler,
  exportInternalAdminsHandler,
  getInternalAdminsStatsHandler,
  loginInternalAdminHandler,
  logoutInternalAdminHandler,
  activateInternalAdminHandler,
  deactivateInternalAdminHandler,
} from "./admin.controller.js";

const router = express.Router();

// Not protected routes
router.post("/internal/admins/login", loginInternalAdminHandler);
router.post("/internal/admins/logout", logoutInternalAdminHandler);

// Protected routes
router.post(
  "/internal/admins",
  authenticateJWT,
  checkPermissions("admin.create", "all.access"),
  createInternalAdminHandler
);

router.get(
  "/internal/admins/me",
  authenticateJWT,
  checkPermissions("admin.read", "all.access"),
  getCurrentAdminHandler
);

router.get(
  "/internal/admins/search",
  authenticateJWT,
  checkPermissions("admin.read", "all.access"),
  searchQuery([
    "personalInfo.firstName",
    "personalInfo.lastName",
    "personalInfo.fullName",
    "personalInfo.email",
    "personalInfo.cellNumber",
    "roles",
    "status",
  ]),
  searchInternalAdminsHandler
);

router.get(
  "/internal/admins/export",
  authenticateJWT,
  checkPermissions("admin.read", "all.access"),
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
  exportInternalAdminsHandler
);

router.get(
  "/internal/admins/stats",
  authenticateJWT,
  checkPermissions("admin.read", "all.access"),
  getInternalAdminsStatsHandler
);

router.post(
  "/internal/admins/bulk",
  authenticateJWT,
  checkPermissions(
    "admin.create",
    "admin.update",
    "admin.delete",
    "all.access"
  ),
  bulkInternalAdminsHandler
);

router.get(
  "/internal/admins",
  authenticateJWT,
  checkPermissions("admin.read", "all.access"),
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
  listInternalAdminsHandler
);

router.get(
  "/internal/admins/:id",
  authenticateJWT,
  checkPermissions("admin.read", "all.access"),
  getInternalAdminByIdHandler
);

router.put(
  "/internal/admins/:id",
  authenticateJWT,
  checkPermissions("admin.update", "all.access"),
  updateInternalAdminByIdHandler
);

router.patch(
  "/internal/admins/:id",
  authenticateJWT,
  checkPermissions("admin.update", "all.access"),
  patchInternalAdminByIdHandler
);

router.delete(
  "/internal/admins/:id",
  authenticateJWT,
  checkPermissions("admin.delete", "all.access"),
  deleteInternalAdminByIdHandler
);

router.put(
  "/internal/admins/:id/activate",
  authenticateJWT,
  checkPermissions("admin.update", "all.access"),
  activateInternalAdminHandler
);

router.put(
  "/internal/admins/:id/deactivate",
  authenticateJWT,
  checkPermissions("admin.update", "all.access"),
  deactivateInternalAdminHandler
);

export default router;
