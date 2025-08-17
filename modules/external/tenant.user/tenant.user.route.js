import express from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import {
  createTenantUserHandler,
  getTenantUserByIdHandler,
  listTenantUsersHandler,
  updateTenantUserHandler,
  deleteTenantUserHandler,
  loginTenantUserHandler,
  readRoles,
  writeRoles,
} from "./tenant.user.controller.js";

const router = express.Router();

// Not protected (per prompt for tenantUser): login/logout
router.post("/external/tenantUser/login", loginTenantUserHandler);
router.post("/external/tenantUser/logout", (_req, res) =>
  res.json({ success: true })
);

// Protected
router.post(
  "/external/tenantUser",
  authenticateJWT,
  authorize(...writeRoles),
  createTenantUserHandler
);
router.get(
  "/external/tenantUser/list",
  authenticateJWT,
  authorize(...readRoles),
  listTenantUsersHandler
);
router.get(
  "/external/tenantUser/:id",
  authenticateJWT,
  authorize(...readRoles),
  getTenantUserByIdHandler
);
router.put(
  "/external/tenantUser/:id",
  authenticateJWT,
  authorize(...writeRoles),
  updateTenantUserHandler
);
router.put(
  "/external/tenantUser/activate/:id",
  authenticateJWT,
  authorize(...writeRoles),
  updateTenantUserHandler
);
router.put(
  "/external/tenantUser/deactivate/:id",
  authenticateJWT,
  authorize(...writeRoles),
  updateTenantUserHandler
);
router.delete(
  "/external/tenantUser/:id",
  authenticateJWT,
  authorize(...writeRoles),
  deleteTenantUserHandler
);

export default router;
