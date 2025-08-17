import { Router } from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import { readRoles, writeRoles } from "./tenant.internal.alarm.service.js";
import {
  putMenuItemHandler,
  getMenuItemListHandler,
  getMenuItemAlarmHandler,
  deleteMenuItemAlarmHandler,
  listAllMenusHandler,
} from "./tenant.internal.alarm.controller.js";

const router = Router();

// Base: /external/tenantInternalAlarm

router.put(
  "/external/tenantInternalAlarm/:menuKey",
  authenticateJWT,
  authorize(...writeRoles),
  putMenuItemHandler
);

router.get(
  "/external/tenantInternalAlarm/:menuKey/list",
  authenticateJWT,
  authorize(...readRoles),
  getMenuItemListHandler
);

router.get(
  "/external/tenantInternalAlarm/:menuKey/:alarmId",
  authenticateJWT,
  authorize(...readRoles),
  getMenuItemAlarmHandler
);

router.delete(
  "/external/tenantInternalAlarm/:menuKey/:alarmId",
  authenticateJWT,
  authorize(...writeRoles),
  deleteMenuItemAlarmHandler
);

router.get(
  "/external/tenantInternalAlarm/list",
  authenticateJWT,
  authorize(...readRoles),
  listAllMenusHandler
);

export default router;
