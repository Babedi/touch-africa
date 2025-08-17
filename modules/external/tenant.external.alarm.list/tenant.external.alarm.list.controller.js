import { z } from "zod";
import { getServiceInfo } from "../../general/service.info/service.info.firestore.js";
import { authenticateJWT } from "../../../middleware/auth.middleware.js"; // not used here, but pattern parity
import {
  TenantExternalAlarmListSchema,
  TenantExternalAlarmListUpdateSchema,
} from "./tenant.external.alarm.list.validation.js";
import {
  serviceCreateTenantExternalAlarmList,
  serviceGetTenantExternalAlarmListById,
  serviceUpdateTenantExternalAlarmList,
  serviceDeleteTenantExternalAlarmList,
  serviceListTenantExternalAlarmLists,
  serviceActivateTenantExternalAlarmList,
  serviceDeactivateTenantExternalAlarmList,
} from "./tenant.external.alarm.list.service.js";

function actorFrom(req) {
  const p = req.admin || req.user || {};
  return p.id || p.email || "anonymous";
}

export async function createTenantExternalAlarmListHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"] || req.params.tenantId; // support header or path param
    if (!tenantId)
      return res.status(400).json({
        error: "MissingTenantId",
        message: "x-tenant-id header required",
      });
    const body = TenantExternalAlarmListSchema.parse(req.body);
    // Validate sgmModuleType membership from service lookups
    const svc = await getServiceInfo();
    const allowed = new Set(
      ((svc && svc.lookups && svc.lookups.gsmModuleTypes) || []).map(String)
    );
    if (allowed.size && !allowed.has(String(body.sgmModuleType))) {
      return res
        .status(400)
        .json({ error: "InvalidValue", field: "sgmModuleType" });
    }
    const data = await serviceCreateTenantExternalAlarmList(
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

export async function getTenantExternalAlarmListByIdHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"] || req.params.tenantId;
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    const { id } = req.params;
    const data = await serviceGetTenantExternalAlarmListById(tenantId, id);
    if (!data) return res.status(404).json({ error: "NotFound" });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listTenantExternalAlarmListsHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"] || req.params.tenantId;
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    const data = await serviceListTenantExternalAlarmLists(tenantId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateTenantExternalAlarmListHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"] || req.params.tenantId;
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    const { id } = req.params;
    const body = TenantExternalAlarmListUpdateSchema.parse(req.body);
    if (body.sgmModuleType) {
      const svc = await getServiceInfo();
      const allowed = new Set(
        ((svc && svc.lookups && svc.lookups.gsmModuleTypes) || []).map(String)
      );
      if (allowed.size && !allowed.has(String(body.sgmModuleType))) {
        return res
          .status(400)
          .json({ error: "InvalidValue", field: "sgmModuleType" });
      }
    }
    const data = await serviceUpdateTenantExternalAlarmList(
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

export async function deleteTenantExternalAlarmListHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"] || req.params.tenantId;
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    const { id } = req.params;
    const data = await serviceDeleteTenantExternalAlarmList(tenantId, id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function activateTenantExternalAlarmListHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"] || req.params.tenantId;
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    const { id } = req.params;
    const data = await serviceActivateTenantExternalAlarmList(
      tenantId,
      id,
      actorFrom(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function deactivateTenantExternalAlarmListHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"] || req.params.tenantId;
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    const { id } = req.params;
    const data = await serviceDeactivateTenantExternalAlarmList(
      tenantId,
      id,
      actorFrom(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
