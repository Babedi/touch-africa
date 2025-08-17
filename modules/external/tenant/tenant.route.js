import express from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import {
  createTenantHandler,
  getTenantByIdHandler,
  listTenantsHandler,
  updateTenantHandler,
  deleteTenantHandler,
  readRoles,
  writeRoles,
} from "./tenant.controller.js";

const router = express.Router();

router.post(
  "/external/tenant",
  authenticateJWT,
  authorize(...writeRoles),
  createTenantHandler
);
router.get(
  "/external/tenant/list",
  authenticateJWT,
  authorize(...readRoles),
  listTenantsHandler
);
router.get(
  "/external/tenant/:id",
  authenticateJWT,
  authorize(...readRoles),
  getTenantByIdHandler
);
router.put(
  "/external/tenant/:id",
  authenticateJWT,
  authorize(...writeRoles),
  updateTenantHandler
);
router.delete(
  "/external/tenant/:id",
  authenticateJWT,
  authorize(...writeRoles),
  deleteTenantHandler
);

export default router;
