import express from "express";
import rateLimit from "express-rate-limit";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../middleware/permission.middleware.js";
import {
  createServiceRequestHandler,
  getServiceRequestByIdHandler,
  updateServiceRequestByIdHandler,
  deleteServiceRequestByIdHandler,
  listServiceRequestsHandler,
  patchServiceRequestByIdHandler,
  searchServiceRequestsHandler,
  bulkServiceRequestsHandler,
  exportServiceRequestsHandler,
  getServiceRequestsStatsHandler,
} from "./service.request.controller.js";

const router = express.Router();

// Write: everyone (rate limited)
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 150 });
router.post(
  "/internal/service-requests",
  writeLimiter,
  createServiceRequestHandler
);

// Protected reads/updates/deletes
router.get(
  "/internal/service-requests/:id",
  authenticateJWT,
  checkPermissions("service.read"),
  getServiceRequestByIdHandler
);
router.put(
  "/internal/service-requests/:id",
  authenticateJWT,
  checkPermissions("service.update"),
  updateServiceRequestByIdHandler
);
router.delete(
  "/internal/service-requests/:id",
  authenticateJWT,
  checkPermissions("service.delete"),
  deleteServiceRequestByIdHandler
);
router.patch(
  "/internal/service-requests/:id",
  authenticateJWT,
  checkPermissions("service.update"),
  patchServiceRequestByIdHandler
);
router.get(
  "/internal/service-requests",
  authenticateJWT,
  checkPermissions("service.read"),
  listServiceRequestsHandler
);

// Enhanced search
router.get(
  "/internal/service-requests/search",
  authenticateJWT,
  checkPermissions("service.read"),
  searchServiceRequestsHandler
);

// Bulk ops
router.post(
  "/internal/service-requests/bulk",
  authenticateJWT,
  checkPermissions("service.update"),
  bulkServiceRequestsHandler
);

// Export
router.get(
  "/internal/service-requests/export",
  authenticateJWT,
  checkPermissions("service.read"),
  exportServiceRequestsHandler
);

// Stats
router.get(
  "/internal/service-requests/stats",
  authenticateJWT,
  checkPermissions("service.read"),
  getServiceRequestsStatsHandler
);

export default router;
