import { z } from "zod";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../middleware/permission.middleware.js";
import {
  serviceCreateTenant,
  serviceGetTenantById,
  serviceListTenants,
  serviceSearchTenants,
  serviceBulkTenants,
  serviceExportTenants,
  serviceGetTenantsStats,
  serviceUpdateTenant,
  serviceDeleteTenant,
  serviceGetTenantNames,
  serviceGetTenantMinimal,
} from "./tenant.service.js";
import {
  sendSuccess,
  sendList,
  sendError,
  sendValidationError,
  sendNotFound,
  handleZodError,
} from "../../../utilities/response.util.js";
import {
  formatPaginatedResponse,
  createExportResponse,
} from "../../../utilities/query.util.js";

// Permissions defined in route handlers directly

// Permissions defined in route handlers directly

function actorFrom(req) {
  const p = req.admin || req.user || {};
  return p.id || p.email || "anonymous";
}

export async function createTenantHandler(req, res, next) {
  try {
    const data = await serviceCreateTenant(req.body, actorFrom(req));

    // After creating tenant, copy all standard permissions and roles to this tenant
    try {
      const { copyStandardPermissionsAndRolesToTenant } = await import(
        "./tenant.service.js"
      );
      await copyStandardPermissionsAndRolesToTenant(data.id, actorFrom(req));
    } catch (copyErr) {
      // Prioritize continuity; log error but don't block tenant creation response
      console.error("⚠️ Failed to copy standard permissions/roles:", copyErr);
    }

    return sendSuccess(res, data, "Tenant created successfully", 201);
  } catch (err) {
    if (err instanceof z.ZodError) return handleZodError(res, err);
    next(err);
  }
}

export async function getTenantByIdHandler(req, res, next) {
  try {
    const data = await serviceGetTenantById(req.params.id);
    if (!data) return sendNotFound(res, "Tenant not found");
    const exposed = { ...data, isActive: !!data?.account?.isActive?.value };
    return sendSuccess(res, exposed, "Tenant retrieved successfully");
  } catch (err) {
    next(err);
  }
}

export async function listTenantsHandler(req, res, next) {
  try {
    const result = await serviceListTenants(req.parsedQuery);

    // Use sendList to properly include pagination data
    return sendList(
      res,
      result.data,
      result.pagination,
      "Tenants retrieved successfully"
    );
  } catch (err) {
    next(err);
  }
}

// Search tenants
export async function searchTenantsHandler(req, res, next) {
  try {
    const result = await serviceSearchTenants(req.parsedQuery);

    // Use sendList to properly include pagination data
    return sendList(
      res,
      result.data,
      result.pagination,
      "Tenant search completed successfully"
    );
  } catch (err) {
    next(err);
  }
}

// Bulk operations for tenants
export async function bulkTenantsHandler(req, res, next) {
  try {
    const { operation, data, filters } = req.body;
    const actor = actorFrom(req);

    const result = await serviceBulkTenants(operation, data, filters, actor);

    return sendSuccess(res, result, `Bulk ${operation} completed successfully`);
  } catch (err) {
    next(err);
  }
}

// Export tenants
export async function exportTenantsHandler(req, res, next) {
  try {
    const { format = "csv" } = req.query;
    const result = await serviceExportTenants(req.parsedQuery, format);

    // Create export response
    const exportResponse = createExportResponse(result.data, format, "tenants");

    res.setHeader("Content-Type", exportResponse.contentType);
    res.setHeader("Content-Disposition", exportResponse.disposition);

    return res.send(exportResponse.content);
  } catch (err) {
    next(err);
  }
}

// Get tenants statistics
export async function getTenantsStatsHandler(req, res, next) {
  try {
    const stats = await serviceGetTenantsStats(req.parsedQuery);

    return sendSuccess(res, stats, "Tenant statistics retrieved successfully");
  } catch (err) {
    next(err);
  }
}

export async function updateTenantHandler(req, res, next) {
  try {
    const data = await serviceUpdateTenant(req.params.id, req.body);
    return sendSuccess(res, data, "Tenant updated successfully");
  } catch (err) {
    console.error("❌ Update tenant error:", err);
    if (err instanceof z.ZodError) return handleZodError(res, err);
    next(err);
  }
}

export async function deleteTenantHandler(req, res, next) {
  try {
    await serviceDeleteTenant(req.params.id);
    return sendSuccess(
      res,
      { message: "Tenant deleted successfully" },
      "Tenant deleted successfully"
    );
  } catch (err) {
    next(err);
  }
}

export async function patchTenantHandler(req, res, next) {
  try {
    const data = await serviceUpdateTenant(req.params.id, req.body);
    return sendSuccess(res, data, "Tenant partially updated successfully");
  } catch (err) {
    if (err instanceof z.ZodError) return handleZodError(res, err);
    next(err);
  }
}

export async function activateTenantHandler(req, res, next) {
  try {
    const actor =
      (req.admin || req.user || {}).id ||
      (req.admin || req.user || {}).email ||
      "anonymous";
    const data = await (
      await import("./tenant.service.js")
    ).serviceActivateTenant(req.params.id, actor);
    return sendSuccess(res, data, "Tenant activated successfully");
  } catch (err) {
    return sendError(
      res,
      "ACTIVATION_FAILED",
      err.message || "Activation failed",
      null,
      err.status || 500
    );
  }
}

export async function deactivateTenantHandler(req, res, next) {
  try {
    const actor =
      (req.admin || req.user || {}).id ||
      (req.admin || req.user || {}).email ||
      "anonymous";
    const data = await (
      await import("./tenant.service.js")
    ).serviceDeactivateTenant(req.params.id, actor);
    return sendSuccess(res, data, "Tenant deactivated successfully");
  } catch (err) {
    return sendError(
      res,
      "DEACTIVATION_FAILED",
      err.message || "Deactivation failed",
      null,
      err.status || 500
    );
  }
}

// Public handler: return tenant names only (no auth route will use this)
export async function getTenantNamesPublicHandler(_req, res, next) {
  try {
    const names = await serviceGetTenantNames();
    return sendSuccess(res, names, "Tenant names retrieved successfully");
  } catch (err) {
    next(err);
  }
}

// Public handler: return minimal tenants list { id, name }
export async function getTenantMinimalPublicHandler(_req, res, next) {
  try {
    const items = await serviceGetTenantMinimal();
    return sendSuccess(res, items, "Tenants retrieved successfully");
  } catch (err) {
    console.error("❌ Error in getTenantMinimalPublicHandler:", err);
    next(err);
  }
}
