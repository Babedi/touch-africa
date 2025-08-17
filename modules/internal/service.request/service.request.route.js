import express from "express";
import rateLimit from "express-rate-limit";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import {
  createServiceRequestHandler,
  getServiceRequestByIdHandler,
  updateServiceRequestByIdHandler,
  deleteServiceRequestByIdHandler,
  listServiceRequestsHandler,
  readRoles,
} from "./service.request.controller.js";

const router = express.Router();

// Write: everyone (rate limited)
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 150 });
router.post(
  "/internal/serviceRequest",
  writeLimiter,
  createServiceRequestHandler
);

// Protected reads/updates/deletes
router.get(
  "/internal/serviceRequest/:id",
  authenticateJWT,
  authorize(...readRoles),
  getServiceRequestByIdHandler
);
router.put(
  "/internal/serviceRequest/:id",
  authenticateJWT,
  authorize(...readRoles),
  updateServiceRequestByIdHandler
);
router.delete(
  "/internal/serviceRequest/:id",
  authenticateJWT,
  authorize(...readRoles),
  deleteServiceRequestByIdHandler
);
router.get(
  "/internal/serviceRequest/list",
  authenticateJWT,
  authorize(...readRoles),
  listServiceRequestsHandler
);

export default router;
