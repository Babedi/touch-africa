import { Router } from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import {
  putMenuItemHandler,
  getMenuItemHandler,
  listMenuHandler,
  bulkPutMenuHandler,
  deleteMenuItemHandler,
  readRoles,
  writeRoles,
} from "./tenant.external.responder.controller.js";

const router = Router();

// Base: /services/neighbourGuardService/tenants/:tenantId/externalResponders

router.put(
  "/services/neighbourGuardService/tenants/:tenantId/externalResponders/:menuKey",
  authenticateJWT,
  authorize(...writeRoles),
  putMenuItemHandler
);

router.get(
  "/services/neighbourGuardService/tenants/:tenantId/externalResponders/:menuKey",
  authenticateJWT,
  authorize(...readRoles),
  getMenuItemHandler
);

router.get(
  "/services/neighbourGuardService/tenants/:tenantId/externalResponders",
  authenticateJWT,
  authorize(...readRoles),
  listMenuHandler
);

router.put(
  "/services/neighbourGuardService/tenants/:tenantId/externalResponders",
  authenticateJWT,
  authorize(...writeRoles),
  bulkPutMenuHandler
);

router.delete(
  "/services/neighbourGuardService/tenants/:tenantId/externalResponders/:menuKey",
  authenticateJWT,
  authorize(...writeRoles),
  deleteMenuItemHandler
);

export default router;
