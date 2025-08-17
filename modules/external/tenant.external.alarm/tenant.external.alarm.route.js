import { Router } from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import { readRoles, writeRoles } from "./tenant.external.alarm.service.js";
import {
  putMenuItemHandler,
  getMenuItemListHandler,
  getMenuItemAlarmHandler,
  deleteMenuItemAlarmHandler,
  listAllMenusHandler,
} from "./tenant.external.alarm.controller.js";

const router = Router();

// Base: /external/tenantExternalAlarm

router.put(
  "/external/tenantExternalAlarm/:menuKey",
  authenticateJWT,
  authorize(...writeRoles),
  putMenuItemHandler
);

// Accept legacy/alternate form with an extra :alarmId segment (ignored by handler)
router.put(
  "/external/tenantExternalAlarm/:menuKey/:alarmId",
  authenticateJWT,
  authorize(...writeRoles),
  putMenuItemHandler
);

router.get(
  "/external/tenantExternalAlarm/:menuKey/list",
  authenticateJWT,
  authorize(...readRoles),
  getMenuItemListHandler
);

router.get(
  "/external/tenantExternalAlarm/:menuKey/:alarmId",
  authenticateJWT,
  authorize(...readRoles),
  getMenuItemAlarmHandler
);

router.delete(
  "/external/tenantExternalAlarm/:menuKey/:alarmId",
  authenticateJWT,
  authorize(...writeRoles),
  deleteMenuItemAlarmHandler
);

router.get(
  "/external/tenantExternalAlarm/list",
  authenticateJWT,
  authorize(...readRoles),
  listAllMenusHandler
);

export default router;
