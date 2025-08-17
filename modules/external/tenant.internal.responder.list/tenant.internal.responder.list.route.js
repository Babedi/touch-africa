import { Router } from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import {
  createTenantInternalResponderListHandler,
  getTenantInternalResponderListByIdHandler,
  listTenantInternalResponderListsHandler,
  updateTenantInternalResponderListHandler,
  deleteTenantInternalResponderListHandler,
  activateTenantInternalResponderListHandler,
  deactivateTenantInternalResponderListHandler,
  readRoles,
  writeRoles,
} from "./tenant.internal.responder.list.controller.js";

const router = Router();

// Base: /services/neighbourGuardService/tenants/:tenantId/internalRespondersList

router.post(
  "/services/neighbourGuardService/tenants/:tenantId/internalRespondersList",
  authenticateJWT,
  authorize(...writeRoles),
  createTenantInternalResponderListHandler
);

router.get(
  "/services/neighbourGuardService/tenants/:tenantId/internalRespondersList/:id",
  authenticateJWT,
  authorize(...readRoles),
  getTenantInternalResponderListByIdHandler
);

router.get(
  "/services/neighbourGuardService/tenants/:tenantId/internalRespondersList",
  authenticateJWT,
  authorize(...readRoles),
  listTenantInternalResponderListsHandler
);

router.put(
  "/services/neighbourGuardService/tenants/:tenantId/internalRespondersList/:id",
  authenticateJWT,
  authorize(...writeRoles),
  updateTenantInternalResponderListHandler
);

router.put(
  "/services/neighbourGuardService/tenants/:tenantId/internalRespondersList/activate/:id",
  authenticateJWT,
  authorize(...writeRoles),
  activateTenantInternalResponderListHandler
);

router.put(
  "/services/neighbourGuardService/tenants/:tenantId/internalRespondersList/deactivate/:id",
  authenticateJWT,
  authorize(...writeRoles),
  deactivateTenantInternalResponderListHandler
);

router.delete(
  "/services/neighbourGuardService/tenants/:tenantId/internalRespondersList/:id",
  authenticateJWT,
  authorize(...writeRoles),
  deleteTenantInternalResponderListHandler
);

export default router;
