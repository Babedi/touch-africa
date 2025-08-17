import { Router } from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import {
  createTenantExternalAlarmListHandler,
  getTenantExternalAlarmListByIdHandler,
  listTenantExternalAlarmListsHandler,
  updateTenantExternalAlarmListHandler,
  deleteTenantExternalAlarmListHandler,
  activateTenantExternalAlarmListHandler,
  deactivateTenantExternalAlarmListHandler,
} from "./tenant.external.alarm.list.controller.js";
import { readRoles, writeRoles } from "./tenant.external.alarm.list.service.js";

const router = Router();

// Base: /external/tenantExternalAlarmList

router.post(
  "/external/tenantExternalAlarmList",
  authenticateJWT,
  authorize(...writeRoles),
  createTenantExternalAlarmListHandler
);

router.get(
  "/external/tenantExternalAlarmList/list",
  authenticateJWT,
  authorize(...readRoles),
  listTenantExternalAlarmListsHandler
);

router.get(
  "/external/tenantExternalAlarmList/:id",
  authenticateJWT,
  authorize(...readRoles),
  getTenantExternalAlarmListByIdHandler
);

router.put(
  "/external/tenantExternalAlarmList/:id",
  authenticateJWT,
  authorize(...writeRoles),
  updateTenantExternalAlarmListHandler
);

router.delete(
  "/external/tenantExternalAlarmList/:id",
  authenticateJWT,
  authorize(...writeRoles),
  deleteTenantExternalAlarmListHandler
);

router.put(
  "/external/tenantExternalAlarmList/activate/:id",
  authenticateJWT,
  authorize(...writeRoles),
  activateTenantExternalAlarmListHandler
);
router.put(
  "/external/tenantExternalAlarmList/deactivate/:id",
  authenticateJWT,
  authorize(...writeRoles),
  deactivateTenantExternalAlarmListHandler
);

export default router;

// ALSO SUPPORT SERVICE-STYLE PATHS (non-breaking aliases)
router.post(
  "/services/neighbourGuardService/tenants/:tenantId/externalAlarmsList",
  authenticateJWT,
  authorize(...writeRoles),
  createTenantExternalAlarmListHandler
);

router.get(
  "/services/neighbourGuardService/tenants/:tenantId/externalAlarmsList/:id",
  authenticateJWT,
  authorize(...readRoles),
  getTenantExternalAlarmListByIdHandler
);

router.get(
  "/services/neighbourGuardService/tenants/:tenantId/externalAlarmsList",
  authenticateJWT,
  authorize(...readRoles),
  listTenantExternalAlarmListsHandler
);

router.put(
  "/services/neighbourGuardService/tenants/:tenantId/externalAlarmsList/:id",
  authenticateJWT,
  authorize(...writeRoles),
  updateTenantExternalAlarmListHandler
);

router.delete(
  "/services/neighbourGuardService/tenants/:tenantId/externalAlarmsList/:id",
  authenticateJWT,
  authorize(...writeRoles),
  deleteTenantExternalAlarmListHandler
);

router.put(
  "/services/neighbourGuardService/tenants/:tenantId/externalAlarmsList/activate/:id",
  authenticateJWT,
  authorize(...writeRoles),
  activateTenantExternalAlarmListHandler
);
router.put(
  "/services/neighbourGuardService/tenants/:tenantId/externalAlarmsList/deactivate/:id",
  authenticateJWT,
  authorize(...writeRoles),
  deactivateTenantExternalAlarmListHandler
);
