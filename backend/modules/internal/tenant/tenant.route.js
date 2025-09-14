import express from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import {
  advancedListQuery,
  searchQuery,
  exportQuery,
} from "../../../middleware/query.middleware.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../middleware/permission.middleware.js";
import {
  createTenantHandler,
  getTenantByIdHandler,
  listTenantsHandler,
  searchTenantsHandler,
  bulkTenantsHandler,
  exportTenantsHandler,
  getTenantsStatsHandler,
  updateTenantHandler,
  deleteTenantHandler,
  activateTenantHandler,
  deactivateTenantHandler,
  patchTenantHandler,
  getTenantNamesPublicHandler,
  getTenantMinimalPublicHandler,
} from "./tenant.controller.js";

const router = express.Router();

// Public, non-authenticated route for tenant names (for dropdowns)
router.get("/tenants/names", getTenantNamesPublicHandler);
// Public, minimal tenants list
router.get("/tenants/minimal", getTenantMinimalPublicHandler);

router.post(
  "/internal/tenants",
  authenticateJWT,
  checkPermissions("tenant.create", "all.access"),
  createTenantHandler
);

router.get(
  "/internal/tenants/search",
  authenticateJWT,
  checkPermissions("tenant.read", "all.access"),
  searchQuery(["name", "contact.email", "contact.phoneNumber"]),
  searchTenantsHandler
);

router.get(
  "/internal/tenants/export",
  authenticateJWT,
  checkPermissions("tenant.read", "all.access"),
  exportQuery({
    sortFields: ["name", "created.when"],
    filterFields: ["account.isActive.value", "name"],
  }),
  exportTenantsHandler
);

router.get(
  "/internal/tenants/stats",
  authenticateJWT,
  checkPermissions("tenant.read", "all.access"),
  getTenantsStatsHandler
);

router.post(
  "/internal/tenants/bulk",
  authenticateJWT,
  checkPermissions(
    "tenant.create",
    "tenant.update",
    "tenant.delete",
    "all.access"
  ),
  bulkTenantsHandler
);

router.get(
  "/internal/tenants",
  authenticateJWT,
  checkPermissions("tenant.read", "all.access"),
  advancedListQuery({
    sortFields: ["name", "created.when"],
    filterFields: ["account.isActive.value", "name"],
    searchFields: ["name", "contact.email", "contact.phoneNumber"],
    expands: ["address", "contactInfo"],
  }),
  listTenantsHandler
);

router.get(
  "/internal/tenants/:id",
  authenticateJWT,
  checkPermissions("tenant.read", "all.access"),
  getTenantByIdHandler
);
router.put(
  "/internal/tenants/:id",
  authenticateJWT,
  checkPermissions("tenant.update", "all.access"),
  updateTenantHandler
);
router.patch(
  "/internal/tenants/:id",
  authenticateJWT,
  checkPermissions("tenant.update", "all.access"),
  patchTenantHandler
);
router.delete(
  "/internal/tenants/:id",
  authenticateJWT,
  checkPermissions("tenant.delete", "all.access"),
  deleteTenantHandler
);

// Activate/deactivate tenant (REST-style status updates)
router.put(
  "/internal/tenants/:id/activate",
  authenticateJWT,
  checkPermissions("tenant.update", "all.access"),
  activateTenantHandler
);
router.put(
  "/internal/tenants/:id/deactivate",
  authenticateJWT,
  checkPermissions("tenant.update", "all.access"),
  deactivateTenantHandler
);

export default router;
