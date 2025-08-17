import express from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import {
  createLookupController,
  getLookupController,
  updateLookupController,
  deleteLookupController,
  getAllLookupsController,
  readRoles,
  writeRoles,
} from "./lookup.controller.js";

const router = express.Router();

// POST /internal/lookup - Create new lookup
router.post(
  "/internal/lookup",
  authenticateJWT,
  authorize(...writeRoles),
  createLookupController
);

// GET /internal/lookup/list - Get all lookups
router.get(
  "/internal/lookup/list",
  authenticateJWT,
  authorize(...readRoles),
  getAllLookupsController
);

// GET /internal/lookup/:id - Get lookup by ID
router.get(
  "/internal/lookup/:id",
  authenticateJWT,
  authorize(...readRoles),
  getLookupController
);

// PUT /internal/lookup/:id - Update lookup by ID
router.put(
  "/internal/lookup/:id",
  authenticateJWT,
  authorize(...writeRoles),
  updateLookupController
);

// DELETE /internal/lookup/:id - Delete lookup by ID
router.delete(
  "/internal/lookup/:id",
  authenticateJWT,
  authorize(...writeRoles),
  deleteLookupController
);

export default router;
