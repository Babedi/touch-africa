import { Router } from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import { readRoles, writeRoles } from "./tenant.internal.alarm.list.service.js";
import {
  createTenantInternalAlarmListHandler,
  getTenantInternalAlarmListByIdHandler,
  listTenantInternalAlarmListsHandler,
  updateTenantInternalAlarmListHandler,
  deleteTenantInternalAlarmListHandler,
} from "./tenant.internal.alarm.list.controller.js";

const router = Router();

router.post(
  "/external/tenantInternalAlarmList",
  authenticateJWT,
  authorize(...writeRoles),
  createTenantInternalAlarmListHandler
);
router.get(
  "/external/tenantInternalAlarmList/list",
  authenticateJWT,
  authorize(...readRoles),
  listTenantInternalAlarmListsHandler
);
router.get(
  "/external/tenantInternalAlarmList/:id",
  authenticateJWT,
  authorize(...readRoles),
  getTenantInternalAlarmListByIdHandler
);
router.put(
  "/external/tenantInternalAlarmList/:id",
  authenticateJWT,
  authorize(...writeRoles),
  updateTenantInternalAlarmListHandler
);
router.delete(
  "/external/tenantInternalAlarmList/:id",
  authenticateJWT,
  authorize(...writeRoles),
  deleteTenantInternalAlarmListHandler
);

export default router;
