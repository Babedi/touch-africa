import { Router } from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import {
  createTenantExternalResponderListHandler,
  getTenantExternalResponderListByIdHandler,
  listTenantExternalResponderListsHandler,
  updateTenantExternalResponderListHandler,
  deleteTenantExternalResponderListHandler,
  activateTenantExternalResponderListHandler,
  deactivateTenantExternalResponderListHandler,
  readRoles,
  writeRoles,
} from "./tenant.external.responder.list.controller.js";

const router = Router();

// Base: /services/neighbourGuardService/tenants/:tenantId/externalRespondersList

router.post(
  "/services/neighbourGuardService/tenants/:tenantId/externalRespondersList",
  authenticateJWT,
  authorize(...writeRoles),
  createTenantExternalResponderListHandler
);

router.get(
  "/services/neighbourGuardService/tenants/:tenantId/externalRespondersList/:id",
  authenticateJWT,
  authorize(...readRoles),
  getTenantExternalResponderListByIdHandler
);

router.get(
  "/services/neighbourGuardService/tenants/:tenantId/externalRespondersList",
  authenticateJWT,
  authorize(...readRoles),
  listTenantExternalResponderListsHandler
);

router.put(
  "/services/neighbourGuardService/tenants/:tenantId/externalRespondersList/:id",
  authenticateJWT,
  authorize(...writeRoles),
  updateTenantExternalResponderListHandler
);

router.put(
  "/services/neighbourGuardService/tenants/:tenantId/externalRespondersList/activate/:id",
  authenticateJWT,
  authorize(...writeRoles),
  activateTenantExternalResponderListHandler
);

router.put(
  "/services/neighbourGuardService/tenants/:tenantId/externalRespondersList/deactivate/:id",
  authenticateJWT,
  authorize(...writeRoles),
  deactivateTenantExternalResponderListHandler
);

router.delete(
  "/services/neighbourGuardService/tenants/:tenantId/externalRespondersList/:id",
  authenticateJWT,
  authorize(...writeRoles),
  deleteTenantExternalResponderListHandler
);

export default router;
