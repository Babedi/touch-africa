import express from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import {
  createTenantUserPrivateResponderHandler,
  getTenantUserPrivateResponderByIdHandler,
  updateTenantUserPrivateResponderHandler,
  deleteTenantUserPrivateResponderHandler,
  listTenantUserPrivateRespondersHandler,
  readRoles,
  writeRoles,
} from "./tenant.user.private.responders.controller.js";

const router = express.Router();

// Base: /external/tenantUserPrivateResponders/:userId
router.get(
  "/external/tenantUserPrivateResponders/list/:userId",
  authenticateJWT,
  authorize(...readRoles),
  listTenantUserPrivateRespondersHandler
);
router.post(
  "/external/tenantUserPrivateResponders/:userId",
  authenticateJWT,
  authorize(...writeRoles),
  createTenantUserPrivateResponderHandler
);
router.get(
  "/external/tenantUserPrivateResponders/:userId/:id",
  authenticateJWT,
  authorize(...readRoles),
  getTenantUserPrivateResponderByIdHandler
);
router.put(
  "/external/tenantUserPrivateResponders/:userId/:id",
  authenticateJWT,
  authorize(...writeRoles),
  updateTenantUserPrivateResponderHandler
);
router.delete(
  "/external/tenantUserPrivateResponders/:userId/:id",
  authenticateJWT,
  authorize(...writeRoles),
  deleteTenantUserPrivateResponderHandler
);

export default router;
