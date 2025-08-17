import { z } from "zod";
import {
  serviceCreateTenantUserPrivateResponder,
  serviceGetTenantUserPrivateResponderById,
  serviceUpdateTenantUserPrivateResponder,
  serviceDeleteTenantUserPrivateResponder,
  serviceListTenantUserPrivateResponders,
} from "./tenant.user.private.responders.service.js";

export const readRoles = [
  "internalRootAdmin",
  "internalSuperAdmin",
  "internalTenantManager",
  "externalRootAdmin",
  "externalSuperAdmin",
  "externalTenantManager",
  "externalTenantUserManager",
  "externalTenantUser",
];

export const writeRoles = [
  "internalRootAdmin",
  "internalSuperAdmin",
  "internalTenantManager",
  "externalRootAdmin",
  "externalSuperAdmin",
  "externalTenantManager",
  "externalTenantUserManager",
  "externalTenantUser",
];

function actorFrom(req) {
  const p = req.admin || req.user || {};
  return p.id || p.email || "anonymous";
}

export async function createTenantUserPrivateResponderHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"]; // consistent with other external modules
    const userId = req.params.userId;
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    if (!userId) return res.status(400).json({ error: "MissingUserId" });
    const data = await serviceCreateTenantUserPrivateResponder(
      tenantId,
      userId,
      req.body,
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

export async function getTenantUserPrivateResponderByIdHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"];
    const userId = req.params.userId;
    const id = req.params.id;
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    const data = await serviceGetTenantUserPrivateResponderById(
      tenantId,
      userId,
      id
    );
    if (!data) return res.status(404).json({ error: "NotFound" });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateTenantUserPrivateResponderHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"];
    const userId = req.params.userId;
    const id = req.params.id;
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    const data = await serviceUpdateTenantUserPrivateResponder(
      tenantId,
      userId,
      id,
      req.body
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

export async function deleteTenantUserPrivateResponderHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"];
    const userId = req.params.userId;
    const id = req.params.id;
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    await serviceDeleteTenantUserPrivateResponder(tenantId, userId, id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function listTenantUserPrivateRespondersHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"];
    const userId = req.params.userId;
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    const data = await serviceListTenantUserPrivateResponders(tenantId, userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
