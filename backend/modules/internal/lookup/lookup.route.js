import express from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../middleware/permission.middleware.js";
import {
  createLookupController,
  getLookupController,
  updateLookupController,
  patchLookupController,
  deleteLookupController,
  getAllLookupsController,
  searchLookupsController,
  bulkLookupsController,
  exportLookupsController,
  getLookupsStatsController,
} from "./lookup.controller.js";

const router = express.Router();

// POST /internal/lookups - Create new lookup
router.post(
  "/internal/lookups",
  authenticateJWT,
  checkPermissions("lookup.create"),
  createLookupController
);

// GET /internal/lookups - Get all lookups
router.get(
  "/internal/lookups",
  authenticateJWT,
  checkPermissions("lookup.read"),
  getAllLookupsController
);

// Enhanced search
router.get(
  "/internal/lookups/search",
  authenticateJWT,
  checkPermissions("lookup.read"),
  searchLookupsController
);

// Enhanced search with full query support (q, filters, sort, pagination)
router.get(
  "/internal/lookups/query",
  authenticateJWT,
  checkPermissions("lookup.read"),
  searchLookupsController
);

// Bulk operations
router.post(
  "/internal/lookups/bulk",
  authenticateJWT,
  checkPermissions("lookup.update"),
  bulkLookupsController
);

// Export
router.get(
  "/internal/lookups/export",
  authenticateJWT,
  checkPermissions("lookup.read"),
  exportLookupsController
);

// Stats
router.get(
  "/internal/lookups/stats",
  authenticateJWT,
  checkPermissions("lookup.read"),
  getLookupsStatsController
);

// GET /internal/lookups/:id - Get lookup by ID
router.get(
  "/internal/lookups/:id",
  authenticateJWT,
  checkPermissions("lookup.read"),
  getLookupController
);

// PUT /internal/lookups/:id - Update lookup by ID
router.put(
  "/internal/lookups/:id",
  authenticateJWT,
  checkPermissions("lookup.update"),
  updateLookupController
);

// PATCH /internal/lookups/:id - Partially update lookup by ID
router.patch(
  "/internal/lookups/:id",
  authenticateJWT,
  checkPermissions("lookup.update"),
  patchLookupController
);

// DELETE /internal/lookups/:id - Delete lookup by ID
router.delete(
  "/internal/lookups/:id",
  authenticateJWT,
  checkPermissions("lookup.delete"),
  deleteLookupController
);

export default router;
