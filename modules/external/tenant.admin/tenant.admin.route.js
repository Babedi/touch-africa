import express from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import {
  createTenantAdminHandler,
  getTenantAdminByIdHandler,
  listTenantAdminsHandler,
  updateTenantAdminHandler,
  deleteTenantAdminHandler,
  loginTenantAdminHandler,
  readRoles,
  writeRoles,
} from "./tenant.admin.controller.js";

const router = express.Router();

// Not protected
router.post("/external/tenantAdmin/login", loginTenantAdminHandler);
router.post("/external/tenantAdmin/logout", (_req, res) =>
  res.json({ success: true })
);

// Protected
router.post(
  "/external/tenantAdmin/:tenantId",
  authenticateJWT,
  authorize(...writeRoles),
  createTenantAdminHandler
);
router.get(
  "/external/tenantAdmin/:tenantId/:id",
  authenticateJWT,
  authorize(...readRoles),
  getTenantAdminByIdHandler
);
router.put(
  "/external/tenantAdmin/:tenantId/:id",
  authenticateJWT,
  authorize(...writeRoles),
  updateTenantAdminHandler
);
router.delete(
  "/external/tenantAdmin/:tenantId/:id",
  authenticateJWT,
  authorize(...writeRoles),
  deleteTenantAdminHandler
);
router.get(
  "/external/tenantAdmin/list/:tenantId",
  authenticateJWT,
  authorize(...readRoles),
  listTenantAdminsHandler
);

export default router;
