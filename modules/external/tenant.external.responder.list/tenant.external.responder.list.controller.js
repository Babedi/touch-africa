import { z } from "zod";
import {
  serviceCreateTenantExternalResponderList,
  serviceGetTenantExternalResponderListById,
  serviceListTenantExternalResponderLists,
  serviceUpdateTenantExternalResponderList,
  serviceDeleteTenantExternalResponderList,
  serviceActivateTenantExternalResponderList,
  serviceDeactivateTenantExternalResponderList,
  readRoles,
  writeRoles,
} from "./tenant.external.responder.list.service.js";
import {
  TenantExternalResponderListSchema,
  TenantExternalResponderListUpdateSchema,
} from "./tenant.external.responder.list.validation.js";

function actorFromReq(req) {
  const p = req.admin || req.user || {};
  return p.id || p.email || "system";
}

export { readRoles, writeRoles };

export async function createTenantExternalResponderListHandler(req, res, next) {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    if (!tenantId)
      throw Object.assign(new Error("Missing tenantId"), { status: 400 });
    const body = TenantExternalResponderListSchema.parse(req.body);
    const data = await serviceCreateTenantExternalResponderList(
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

export async function getTenantExternalResponderListByIdHandler(
  req,
  res,
  next
) {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const id = req.params.id;
    const data = await serviceGetTenantExternalResponderListById(tenantId, id);
    if (!data)
      return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listTenantExternalResponderListsHandler(req, res, next) {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const data = await serviceListTenantExternalResponderLists(tenantId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateTenantExternalResponderListHandler(req, res, next) {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const id = req.params.id;
    const body = TenantExternalResponderListUpdateSchema.parse(req.body);
    const data = await serviceUpdateTenantExternalResponderList(
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

export async function deleteTenantExternalResponderListHandler(req, res, next) {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const id = req.params.id;
    const data = await serviceDeleteTenantExternalResponderList(tenantId, id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function activateTenantExternalResponderListHandler(
  req,
  res,
  next
) {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const id = req.params.id;
    const data = await serviceActivateTenantExternalResponderList(
      tenantId,
      id,
      actorFromReq(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function deactivateTenantExternalResponderListHandler(
  req,
  res,
  next
) {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const id = req.params.id;
    const data = await serviceDeactivateTenantExternalResponderList(
      tenantId,
      id,
      actorFromReq(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
