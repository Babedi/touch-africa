import { z } from "zod";
import {
  ServiceInfoSchema,
  ServiceInfoUpdateSchema,
} from "./service.info.validation.js";
import {
  serviceGetServiceInfo,
  serviceUpdateServiceInfo,
} from "./service.info.service.js";

export const readRoles = [];
export const writeRoles = [
  "internalRootAdmin",
  "internalSuperAdmin",
  "internalServiceIdentityManager",
];

export async function getServiceInfoHandler(_req, res, next) {
  try {
    const data = await serviceGetServiceInfo();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateServiceInfoHandler(req, res, next) {
  try {
    console.log("🔍 Service Info Update - Request body type:", typeof req.body);
    console.log(
      "🔍 Service Info Update - Request body keys:",
      Object.keys(req.body || {})
    );
    console.log(
      "🔍 Service Info Update - Request body sample:",
      JSON.stringify(req.body).substring(0, 200) + "..."
    );

    const parsed = ServiceInfoUpdateSchema.parse(req.body);
    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";
    const data = await serviceUpdateServiceInfo(parsed, actor);
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.log("❌ Service Info Validation Error:", err.errors);
      return res
        .status(400)
        .json({ error: "ValidationError", details: err.errors });
    }
    console.log("❌ Service Info General Error:", err.message);
    next(err);
  }
}
