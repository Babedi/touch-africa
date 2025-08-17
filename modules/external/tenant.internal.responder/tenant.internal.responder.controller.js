import { z } from "zod";
import {
  servicePutMenuItem,
  serviceGetMenuItem,
  serviceDeleteMenuItem,
  serviceListMenu,
  readRoles,
  writeRoles,
} from "./tenant.internal.responder.service.js";

const MenuKeySchema = z.enum([
  "menuItem1",
  "menuItem2",
  "menuItem3",
  "menuItem4",
  "menuItem5",
]);

function actorFromReq(req) {
  const p = req.admin || req.user || {};
  return p.id || p.email || "system";
}

export { readRoles, writeRoles };

export async function putMenuItemHandler(req, res, next) {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    if (!tenantId)
      throw Object.assign(new Error("Missing tenantId"), { status: 400 });
    const key = MenuKeySchema.parse(req.params.menuKey);
    const body = req.body || {};
    const responders = z
      .array(z.string())
      .parse(body.responders ?? body.ids ?? body[key] ?? []);
    const data = await servicePutMenuItem(
      tenantId,
      key,
      responders,
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

export async function getMenuItemHandler(req, res, next) {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const key = MenuKeySchema.parse(req.params.menuKey);
    const data = await serviceGetMenuItem(tenantId, key);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listMenuHandler(req, res, next) {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const data = await serviceListMenu(tenantId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function bulkPutMenuHandler(req, res, next) {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    if (!tenantId)
      throw Object.assign(new Error("Missing tenantId"), { status: 400 });
    const payload = req.body || {};
    const keys = [
      "menuItem1",
      "menuItem2",
      "menuItem3",
      "menuItem4",
      "menuItem5",
    ];
    const results = {};
    for (const k of keys) {
      const arr = Array.isArray(payload[k]) ? payload[k] : [];
      const responders = z.array(z.string()).parse(arr);
      const saved = await servicePutMenuItem(
        tenantId,
        k,
        responders,
        actorFromReq(req)
      );
      results[k] = saved.responders;
    }
    res.json({ success: true, data: results });
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

export async function deleteMenuItemHandler(req, res, next) {
  try {
    const tenantId = req.params.tenantId || req.headers["x-tenant-id"];
    const key = MenuKeySchema.parse(req.params.menuKey);
    const data = await serviceDeleteMenuItem(tenantId, key);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
