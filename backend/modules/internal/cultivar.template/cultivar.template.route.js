import express from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import {
  advancedListQuery,
  searchQuery,
} from "../../../middleware/query.middleware.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../middleware/permission.middleware.js";
import {
  createCultivarTemplate,
  getCultivarTemplate,
  updateCultivarTemplate,
  patchCultivarTemplate,
  deleteCultivarTemplate,
  getAllCultivarTemplates,
  searchCultivarTemplates,
  bulkCultivarTemplates,
  exportCultivarTemplates,
  getCultivarTemplatesStats,
} from "./cultivar.template.controller.js";

const router = express.Router();

// Authorization roles for cultivar template operations
// Permissions defined in route handlers directly

// POST /internal/cultivar-templates - Create new template
router.post(
  "/internal/cultivar-templates",
  authenticateJWT,
  checkPermissions("admin.create"),
  createCultivarTemplate
);

// GET /internal/cultivar-templates/:id - Get template by ID
router.get(
  "/internal/cultivar-templates/:id",
  authenticateJWT,
  checkPermissions("admin.read"),
  getCultivarTemplate
);

// PUT /internal/cultivar-templates/:id - Update template by ID
router.put(
  "/internal/cultivar-templates/:id",
  authenticateJWT,
  checkPermissions("admin.update"),
  updateCultivarTemplate
);

// PATCH /internal/cultivar-templates/:id - Partially update template by ID
router.patch(
  "/internal/cultivar-templates/:id",
  authenticateJWT,
  checkPermissions("admin.update"),
  patchCultivarTemplate
);

// DELETE /internal/cultivar-templates/:id - Delete template by ID
router.delete(
  "/internal/cultivar-templates/:id",
  authenticateJWT,
  checkPermissions("admin.delete"),
  deleteCultivarTemplate
);

// GET /internal/cultivar-templates - List all templates
router.get(
  "/internal/cultivar-templates",
  authenticateJWT,
  checkPermissions("admin.read"),
  advancedListQuery({
    sortFields: [
      "templateName",
      "name",
      "status",
      "version",
      "createdAt",
      "updatedAt",
    ],
    searchFields: [
      "templateName",
      "name",
      "description",
      "category",
      "cultivarType",
      "season",
      "status",
    ],
    filterFields: ["status", "category", "cultivarType", "season"],
  }),
  getAllCultivarTemplates
);

// Enhanced search
router.get(
  "/internal/cultivar-templates/search",
  authenticateJWT,
  checkPermissions("admin.read"),
  searchQuery([
    "templateName",
    "name",
    "description",
    "category",
    "cultivarType",
    "season",
    "status",
  ]),
  searchCultivarTemplates
);

// Bulk ops
router.post(
  "/internal/cultivar-templates/bulk",
  authenticateJWT,
  checkPermissions("admin.update"),
  bulkCultivarTemplates
);

// Export
router.get(
  "/internal/cultivar-templates/export",
  authenticateJWT,
  checkPermissions("admin.read"),
  exportCultivarTemplates
);

// Stats
router.get(
  "/internal/cultivar-templates/stats",
  authenticateJWT,
  checkPermissions("admin.read"),
  getCultivarTemplatesStats
);

export default router;
