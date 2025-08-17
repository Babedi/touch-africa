import { z } from "zod";
import {
  ExternalAlarmMenuUpdateSchema,
  ExternalAlarmMenuKeyedUpdateSchema,
} from "./tenant.external.alarm.validation.js";
import {
  servicePutMenuItem,
  serviceGetMenuItemList,
  serviceGetMenuItemAlarm,
  serviceDeleteMenuItemAlarm,
  serviceListAllMenus,
} from "./tenant.external.alarm.service.js";

function actorFrom(req) {
  const p = req.admin || req.user || {};
  return p.id || p.email || "anonymous";
}

function tenantIdFrom(req) {
  return req.headers["x-tenant-id"];
}

export async function putMenuItemHandler(req, res, next) {
  try {
    const tenantId = tenantIdFrom(req);
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    const { menuKey } = req.params;
    // Accept either schema variants without throwing away body yet
    try {
      ExternalAlarmMenuUpdateSchema.parse(req.body);
    } catch {
      try {
        ExternalAlarmMenuKeyedUpdateSchema.parse(req.body);
      } catch (err) {
        if (err instanceof z.ZodError)
          return res
            .status(400)
            .json({ error: "ValidationError", details: err.errors });
      }
    }
    const data = await servicePutMenuItem(
      tenantId,
      menuKey,
      req.body,
      actorFrom(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getMenuItemListHandler(req, res, next) {
  try {
    const tenantId = tenantIdFrom(req);
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    const { menuKey } = req.params;
    const data = await serviceGetMenuItemList(tenantId, menuKey);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getMenuItemAlarmHandler(req, res, next) {
  try {
    const tenantId = tenantIdFrom(req);
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    const { menuKey, alarmId } = req.params;
    const data = await serviceGetMenuItemAlarm(tenantId, menuKey, alarmId);
    if (!data) return res.status(404).json({ error: "NotFound" });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function deleteMenuItemAlarmHandler(req, res, next) {
  try {
    const tenantId = tenantIdFrom(req);
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    const { menuKey, alarmId } = req.params;
    const data = await serviceDeleteMenuItemAlarm(tenantId, menuKey, alarmId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listAllMenusHandler(req, res, next) {
  try {
    const tenantId = tenantIdFrom(req);
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    const data = await serviceListAllMenus(tenantId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
