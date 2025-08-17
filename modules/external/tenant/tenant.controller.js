import { z } from "zod";
import {
  serviceCreateTenant,
  serviceGetTenantById,
  serviceListTenants,
  serviceUpdateTenant,
  serviceDeleteTenant,
} from "./tenant.service.js";

export const readRoles = [
  "internalRootAdmin",
  "internalSuperAdmin",
  "internalAdmin",
  "internalTenantManager",
  "externalRootAdmin",
  "externalSuperAdmin",
  "externalAdmin",
  "externalTenantUser",
];

export const writeRoles = [
  "internalRootAdmin",
  "internalSuperAdmin",
  "internalTenantManager",
  "externalRootAdmin",
  "externalSuperAdmin",
  "externalTenantManager",
];

function actorFrom(req) {
  const p = req.admin || req.user || {};
  return p.id || p.email || "anonymous";
}

export async function createTenantHandler(req, res, next) {
  try {
    const data = await serviceCreateTenant(req.body, actorFrom(req));
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err instanceof z.ZodError)
      return res
        .status(400)
        .json({ error: "ValidationError", details: err.errors });
    next(err);
  }
}

export async function getTenantByIdHandler(req, res, next) {
  try {
    const data = await serviceGetTenantById(req.params.id);
    if (!data) return res.status(404).json({ error: "NotFound" });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listTenantsHandler(_req, res, next) {
  try {
    const data = await serviceListTenants();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateTenantHandler(req, res, next) {
  try {
    const data = await serviceUpdateTenant(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof z.ZodError)
      return res
        .status(400)
        .json({ error: "ValidationError", details: err.errors });
    next(err);
  }
}

export async function deleteTenantHandler(req, res, next) {
  try {
    await serviceDeleteTenant(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
