import { z } from "zod";
import { getServiceInfo } from "../../general/service.info/service.info.firestore.js";
import {
  TenantInternalAlarmListSchema,
  TenantInternalAlarmListUpdateSchema,
} from "./tenant.internal.alarm.list.validation.js";
import {
  serviceCreateTenantInternalAlarmList,
  serviceGetTenantInternalAlarmListById,
  serviceUpdateTenantInternalAlarmList,
  serviceDeleteTenantInternalAlarmList,
  serviceListTenantInternalAlarmLists,
} from "./tenant.internal.alarm.list.service.js";

function actorFrom(req) {
  const p = req.admin || req.user || {};
  return p.id || p.email || "anonymous";
}

export async function createTenantInternalAlarmListHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"];
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    const body = TenantInternalAlarmListSchema.parse(req.body);
    const svc = await getServiceInfo();
    const allowed = new Set(
      ((svc && svc.lookups && svc.lookups.gsmModuleTypes) || []).map(String)
    );
    if (allowed.size && !allowed.has(String(body.sgmModuleType)))
      return res
        .status(400)
        .json({ error: "InvalidValue", field: "sgmModuleType" });
    const data = await serviceCreateTenantInternalAlarmList(
      tenantId,
      body,
      actorFrom(req)
    );
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err instanceof z.ZodError)
      return res
        .status(400)
        .json({ error: "ValidationError", details: err.errors });
    next(err);
  }
}

export async function getTenantInternalAlarmListByIdHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"];
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    const { id } = req.params;
    const data = await serviceGetTenantInternalAlarmListById(tenantId, id);
    if (!data) return res.status(404).json({ error: "NotFound" });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listTenantInternalAlarmListsHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"];
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    const data = await serviceListTenantInternalAlarmLists(tenantId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateTenantInternalAlarmListHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"];
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    const { id } = req.params;
    const body = TenantInternalAlarmListUpdateSchema.parse(req.body);
    if (body.sgmModuleType) {
      const svc = await getServiceInfo();
      const allowed = new Set(
        ((svc && svc.lookups && svc.lookups.gsmModuleTypes) || []).map(String)
      );
      if (allowed.size && !allowed.has(String(body.sgmModuleType)))
        return res
          .status(400)
          .json({ error: "InvalidValue", field: "sgmModuleType" });
    }
    const data = await serviceUpdateTenantInternalAlarmList(
      tenantId,
      id,
      body,
      actorFrom(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof z.ZodError)
      return res
        .status(400)
        .json({ error: "ValidationError", details: err.errors });
    next(err);
  }
}

export async function deleteTenantInternalAlarmListHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"];
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    const { id } = req.params;
    const data = await serviceDeleteTenantInternalAlarmList(tenantId, id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
