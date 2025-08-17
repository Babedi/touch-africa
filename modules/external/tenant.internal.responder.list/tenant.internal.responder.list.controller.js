import { z } from "zod";
import {
  serviceCreateTenantInternalResponderList,
  serviceGetTenantInternalResponderListById,
  serviceListTenantInternalResponderLists,
  serviceUpdateTenantInternalResponderList,
  serviceDeleteTenantInternalResponderList,
  serviceActivateTenantInternalResponderList,
  serviceDeactivateTenantInternalResponderList,
  readRoles,
  writeRoles,
} from "./tenant.internal.responder.list.service.js";
import {
  TenantInternalResponderListSchema,
  TenantInternalResponderListUpdateSchema,
} from "./tenant.internal.responder.list.validation.js";

function actorFromReq(req) {
  const p = req.admin || req.user || {};
  return p.id || p.email || "system";
}

export { readRoles, writeRoles };

export async function createTenantInternalResponderListHandler(req, res, next) {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    if (!tenantId)
      throw Object.assign(new Error("Missing tenantId"), { status: 400 });
    const body = TenantInternalResponderListSchema.parse(req.body);
    const data = await serviceCreateTenantInternalResponderList(
      tenantId,
      body,
      actorFromReq(req)
    );
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err instanceof z.ZodError)
      return next(
        Object.assign(new Error("Validation failed"), {
          status: 400,
          details: err.issues,
        })
      );
    next(err);
  }
}

export async function getTenantInternalResponderListByIdHandler(
  req,
  res,
  next
) {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const id = req.params.id;
    const data = await serviceGetTenantInternalResponderListById(tenantId, id);
    if (!data)
      return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listTenantInternalResponderListsHandler(req, res, next) {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const data = await serviceListTenantInternalResponderLists(tenantId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateTenantInternalResponderListHandler(req, res, next) {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const id = req.params.id;
    const body = TenantInternalResponderListUpdateSchema.parse(req.body);
    const data = await serviceUpdateTenantInternalResponderList(
      tenantId,
      id,
      body,
      actorFromReq(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof z.ZodError)
      return next(
        Object.assign(new Error("Validation failed"), {
          status: 400,
          details: err.issues,
        })
      );
    next(err);
  }
}

export async function deleteTenantInternalResponderListHandler(req, res, next) {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const id = req.params.id;
    const data = await serviceDeleteTenantInternalResponderList(tenantId, id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function activateTenantInternalResponderListHandler(
  req,
  res,
  next
) {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const id = req.params.id;
    const data = await serviceActivateTenantInternalResponderList(
      tenantId,
      id,
      actorFromReq(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function deactivateTenantInternalResponderListHandler(
  req,
  res,
  next
) {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const id = req.params.id;
    const data = await serviceDeactivateTenantInternalResponderList(
      tenantId,
      id,
      actorFromReq(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
