import { z } from "zod";
import {
  ServiceRequestSchema,
  ServiceRequestUpdateSchema,
  newServiceRequestId,
} from "./service.request.validation.js";
import {
  serviceCreateServiceRequest,
  serviceGetServiceRequestById,
  serviceUpdateServiceRequestById,
  serviceDeleteServiceRequestById,
  serviceGetAllServiceRequests,
} from "./service.request.service.js";

export const readRoles = [
  "internalSuperAdmin",
  "internalServiceRequestsManager",
];
export const writeRoles = [
  // per spec: write is everyone, but we still accept authenticated for now
];

export async function createServiceRequestHandler(req, res, next) {
  try {
    const parsed = ServiceRequestSchema.parse(req.body);
    const id = newServiceRequestId();
    const actor =
      req.admin?.id || req.user?.id || req.user?.email || "anonymous";
    const model = { id, ...parsed };
    const data = await serviceCreateServiceRequest(model, actor);
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "ValidationError", details: err.errors });
    }
    next(err);
  }
}

export async function getServiceRequestByIdHandler(req, res, next) {
  try {
    const data = await serviceGetServiceRequestById(req.params.id);
    if (!data) return res.status(404).json({ error: "NotFound" });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateServiceRequestByIdHandler(req, res, next) {
  try {
    const parsed = ServiceRequestUpdateSchema.parse(req.body);
    const data = await serviceUpdateServiceRequestById(req.params.id, parsed);
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "ValidationError", details: err.errors });
    }
    next(err);
  }
}

export async function deleteServiceRequestByIdHandler(req, res, next) {
  try {
    await serviceDeleteServiceRequestById(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function listServiceRequestsHandler(_req, res, next) {
  try {
    const data = await serviceGetAllServiceRequests();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
