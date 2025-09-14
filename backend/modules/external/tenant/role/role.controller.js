/**
 * External Role Controller
 * HTTP handlers for external role operations
 */

import {
  ExternalRoleSchema,
  ExternalRoleUpdateSchema,
  isValidExternalRoleId,
} from "./role.validation.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../../middleware/permission.middleware.js";
import {
  createExternalRoleService,
  getExternalRoleByIdService,
  updateExternalRoleByIdService,
  deleteExternalRoleByIdService,
  listExternalRolesService,
  searchExternalRolesService,
  bulkExternalRolesService,
  exportExternalRolesService,
  getExternalRolesStatsService,
} from "./role.service.js";
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendValidationErrorEnhanced,
  sendNotFound,
  handleZodError,
  sendList,
} from "../../../../utilities/response.util.js";
import {
  formatModuleValidationErrors,
  formatBusinessValidationErrors,
  getErrorSuggestion,
} from "../../../../utilities/validation.util.js";
import {
  formatPaginatedResponse,
  createExportResponse,
} from "../../../../utilities/query.util.js";

// Define authorization roles
// Permissions defined in route handlers directly
// Permissions defined in route handlers directly

/**
 * Create external role handler
 */
export async function createExternalRoleHandler(req, res, next) {
  try {
    console.log(
      "🔧 Creating role with data:",
      JSON.stringify(req.body, null, 2)
    );

    // Get actor for service layer
    const actor = req.admin?.id || req.user?.id || "system";
    const { tenantId } = req.params;

    if (!tenantId) {
      return sendValidationError(
        res,
        "Tenant ID is required to create a role.",
        {
          tenantId: "Tenant ID parameter is missing from the request",
        }
      );
    }

    const validatedData = ExternalRoleSchema.parse(req.body);

    console.log("✅ Validation passed, creating role...");

    const createdRole = await createExternalRoleService(
      validatedData,
      actor,
      tenantId
    );
    const normalized = normalizeRolePermissions(createdRole);

    return sendSuccess(
      res,
      normalized,
      "External role created successfully",
      201
    );
  } catch (error) {
    console.error("❌ Role creation error:", error);

    if (error.name === "ZodError") {
      console.error(
        "❌ Zod validation errors:",
        JSON.stringify(error.errors, null, 2)
      );
      const formattedErrors = formatModuleValidationErrors(error, "role");
      return sendValidationErrorEnhanced(
        res,
        `Role creation failed: ${formattedErrors.message}`,
        formattedErrors.errors,
        getErrorSuggestion("validation", "role")
      );
    }

    // Handle role code uniqueness error
    if (error.message && error.message.includes("already exists")) {
      return sendValidationError(
        res,
        "Role creation failed: A role with this code already exists in the tenant.",
        {
          roleCode: error.message,
          suggestion: getErrorSuggestion("duplicate", "role"),
        }
      );
    }

    // Handle permission errors
    if (error.message && error.message.includes("permission")) {
      return sendValidationError(
        res,
        "You do not have permission to create roles in this tenant. Please contact your administrator.",
        {
          suggestion: getErrorSuggestion("permission", "role"),
        }
      );
    }

    // Handle database errors
    if (error.message && error.message.includes("Firestore")) {
      return sendError(
        res,
        "DATABASE_ERROR",
        "Database error occurred while creating role. Please try again.",
        null,
        500
      );
    }

    next(error);
  }
}

/**
 * Get external role by ID handler
 */
export async function getExternalRoleByIdHandler(req, res, next) {
  try {
    const { id, tenantId } = req.params;

    if (!id) {
      return sendValidationError(
        res,
        "Role ID is required to retrieve a role.",
        {
          id: "Role ID parameter is missing from the request",
        }
      );
    }

    if (!tenantId) {
      return sendValidationError(
        res,
        "Tenant ID is required to retrieve a role.",
        {
          tenantId: "Tenant ID parameter is missing from the request",
        }
      );
    }

    if (!isValidExternalRoleId(id)) {
      return sendValidationError(
        res,
        "Invalid role ID format. Role ID must be a valid identifier.",
        {
          id: "Role ID format is invalid",
          suggestion: getErrorSuggestion("validation", "role"),
        }
      );
    }

    const role = await getExternalRoleByIdService(id, tenantId);
    const normalized = normalizeRolePermissions(role);
    return sendSuccess(res, normalized, "External role retrieved successfully");
  } catch (error) {
    // Handle not found errors
    if (error.message.includes("not found")) {
      return sendNotFound(
        res,
        `Role with ID '${id}' was not found in tenant '${tenantId}'. Please verify the role ID and try again.`
      );
    }

    // Handle permission errors
    if (
      error.message.includes("permission") ||
      error.message.includes("unauthorized")
    ) {
      return sendValidationError(
        res,
        "You do not have permission to view this role. Please contact your administrator.",
        {
          suggestion: getErrorSuggestion("permission", "role"),
        }
      );
    }

    // Handle database errors
    if (error.message.includes("Firestore")) {
      return sendError(
        res,
        "DATABASE_ERROR",
        "Database error occurred while retrieving role. Please try again.",
        null,
        500
      );
    }

    next(error);
  }
}

/**
 * Update external role handler
 */
export async function updateExternalRoleByIdHandler(req, res, next) {
  try {
    const { id, tenantId } = req.params;

    if (!id) {
      return sendValidationError(res, "Role ID is required to update a role.", {
        id: "Role ID parameter is missing from the request",
      });
    }

    if (!tenantId) {
      return sendValidationError(
        res,
        "Tenant ID is required to update a role.",
        {
          tenantId: "Tenant ID parameter is missing from the request",
        }
      );
    }

    if (!isValidExternalRoleId(id)) {
      return sendValidationError(
        res,
        "Invalid role ID format. Role ID must be a valid identifier.",
        {
          id: "Role ID format is invalid",
          suggestion: getErrorSuggestion("validation", "role"),
        }
      );
    }

    console.log(
      "🔧 Role Update Request Body:",
      JSON.stringify(req.body, null, 2)
    );
    console.log("🔧 Permissions array length:", req.body.permissions?.length);
    console.log("🔧 First 5 permissions:", req.body.permissions?.slice(0, 5));

    const validatedData = ExternalRoleUpdateSchema.parse(req.body);
    const actor = req.admin?.id || req.user?.id || "system";

    const updatedRole = await updateExternalRoleByIdService(
      id,
      validatedData,
      actor,
      tenantId
    );
    const normalized = normalizeRolePermissions(updatedRole);
    return sendSuccess(res, normalized, "External role updated successfully");
  } catch (error) {
    console.error("🚨 Role update error:", error);

    if (error.name === "ZodError") {
      console.error(
        "🚨 Zod validation errors:",
        JSON.stringify(error.errors, null, 2)
      );
      const formattedErrors = formatModuleValidationErrors(error, "role");
      return sendValidationErrorEnhanced(
        res,
        `Role update failed: ${formattedErrors.message}`,
        formattedErrors.errors,
        getErrorSuggestion("validation", "role")
      );
    }

    // Handle not found errors
    if (error.message.includes("not found")) {
      return sendNotFound(
        res,
        `Role with ID '${id}' was not found in tenant '${tenantId}'. Please verify the role ID and try again.`
      );
    }

    // Handle role code uniqueness error
    if (error.message && error.message.includes("already exists")) {
      return sendValidationError(
        res,
        "Role update failed: A role with this code already exists in the tenant.",
        {
          roleCode: error.message,
          suggestion: getErrorSuggestion("duplicate", "role"),
        }
      );
    }

    // Handle permission errors
    if (error.message && error.message.includes("permission")) {
      return sendValidationError(
        res,
        "You do not have permission to update roles in this tenant. Please contact your administrator.",
        {
          suggestion: getErrorSuggestion("permission", "role"),
        }
      );
    }

    // Handle database errors
    if (error.message && error.message.includes("Firestore")) {
      return sendError(
        res,
        "DATABASE_ERROR",
        "Database error occurred while updating role. Please try again.",
        null,
        500
      );
    }

    next(error);
  }
}

/**
 * Delete external role handler
 */
export async function deleteExternalRoleByIdHandler(req, res, next) {
  try {
    const { id, tenantId } = req.params;

    if (!id) {
      return sendValidationError(res, "Role ID is required to delete a role.", {
        id: "Role ID parameter is missing from the request",
      });
    }

    if (!tenantId) {
      return sendValidationError(
        res,
        "Tenant ID is required to delete a role.",
        {
          tenantId: "Tenant ID parameter is missing from the request",
        }
      );
    }

    if (!isValidExternalRoleId(id)) {
      return sendValidationError(
        res,
        "Invalid role ID format. Role ID must be a valid identifier.",
        {
          id: "Role ID format is invalid",
          suggestion: getErrorSuggestion("validation", "role"),
        }
      );
    }

    await deleteExternalRoleByIdService(id, tenantId);

    return sendSuccess(
      res,
      { message: "External role deleted successfully" },
      "External role deleted successfully"
    );
  } catch (error) {
    // Handle not found errors
    if (error.message.includes("not found")) {
      return sendNotFound(
        res,
        `Role with ID '${id}' was not found in tenant '${tenantId}'. The role may have already been deleted or the ID is incorrect.`
      );
    }

    // Handle reference/dependency errors
    if (
      error.message.includes("referenced") ||
      error.message.includes("dependency") ||
      error.message.includes("in use")
    ) {
      return sendValidationError(
        res,
        "Cannot delete role: This role is assigned to users or referenced by other records. Please remove all assignments before deleting.",
        {
          suggestion:
            "Check for users with this role or other dependencies before deletion.",
        }
      );
    }

    // Handle permission errors
    if (
      error.message.includes("permission") ||
      error.message.includes("unauthorized")
    ) {
      return sendValidationError(
        res,
        "You do not have permission to delete roles in this tenant. Please contact your administrator.",
        {
          suggestion: getErrorSuggestion("permission", "role"),
        }
      );
    }

    // Handle database errors
    if (error.message.includes("Firestore")) {
      return sendError(
        res,
        "DATABASE_ERROR",
        "Database error occurred while deleting role. Please try again.",
        null,
        500
      );
    }

    next(error);
  }
}

/**
 * List all external roles handler
 */
export async function listExternalRolesHandler(req, res, next) {
  try {
    const { tenantId } = req.params;
    const result = await listExternalRolesService(req.parsedQuery, tenantId);
    const dataNorm = Array.isArray(result.data)
      ? result.data.map(normalizeRolePermissions)
      : [];
    return sendList(
      res,
      dataNorm,
      result.pagination,
      "External roles retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Search external roles handler
 */
export async function searchExternalRolesHandler(req, res, next) {
  try {
    const { tenantId } = req.params;
    const result = await searchExternalRolesService(req.parsedQuery, tenantId);
    const dataNorm = Array.isArray(result.data)
      ? result.data.map(normalizeRolePermissions)
      : [];
    return sendList(
      res,
      dataNorm,
      result.pagination,
      "Role search completed successfully"
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk operations for external roles handler
 */
export async function bulkExternalRolesHandler(req, res, next) {
  try {
    const { tenantId } = req.params;
    const { operation, data, filters } = req.body;
    const actor =
      req.admin?.id || req.user?.id || req.user?.email || "anonymous";

    const result = await bulkExternalRolesService(
      operation,
      data,
      filters,
      actor,
      tenantId
    );

    return sendSuccess(res, result, `Bulk ${operation} completed successfully`);
  } catch (error) {
    next(error);
  }
}

/**
 * Export external roles handler
 */
export async function exportExternalRolesHandler(req, res, next) {
  try {
    const { tenantId } = req.params;
    const { format = "csv" } = req.query;
    // exportExternalRolesService expects (format, queryParams, tenantId)
    const result = await exportExternalRolesService(
      format,
      req.parsedQuery,
      tenantId
    );

    // Create export response
    const exportResponse = createExportResponse(result.data, format, "roles");

    res.setHeader("Content-Type", exportResponse.contentType);
    res.setHeader("Content-Disposition", exportResponse.disposition);

    return res.send(exportResponse.content);
  } catch (error) {
    next(error);
  }
}

/**
 * Get external roles statistics handler
 */
export async function getExternalRolesStatsHandler(req, res, next) {
  try {
    const { tenantId } = req.params;
    const stats = await getExternalRolesStatsService(req.parsedQuery, tenantId);

    return sendSuccess(res, stats, "Role statistics retrieved successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * Partially update external role by ID handler
 */
export async function patchExternalRoleHandler(req, res, next) {
  try {
    const { id, tenantId } = req.params;

    if (!id) {
      return sendValidationError(res, "Role ID is required to patch a role.", {
        id: "Role ID parameter is missing from the request",
      });
    }

    if (!tenantId) {
      return sendValidationError(
        res,
        "Tenant ID is required to patch a role.",
        {
          tenantId: "Tenant ID parameter is missing from the request",
        }
      );
    }

    if (!isValidExternalRoleId(id)) {
      return sendValidationError(
        res,
        "Invalid role ID format. Role ID must be a valid identifier.",
        {
          id: "Role ID format is invalid",
          suggestion: getErrorSuggestion("validation", "role"),
        }
      );
    }

    // Validate partial update data
    const parsed = ExternalRoleUpdateSchema.partial().parse(req.body);
    const actor = req.admin?.id || req.user?.id || "system";

    const updatedRole = await updateExternalRoleByIdService(
      id,
      parsed,
      actor,
      tenantId
    );
    const normalized = normalizeRolePermissions(updatedRole);
    return sendSuccess(
      res,
      normalized,
      "External role partially updated successfully"
    );
  } catch (error) {
    if (error.name === "ZodError") {
      const formattedErrors = formatModuleValidationErrors(error, "role");
      return sendValidationErrorEnhanced(
        res,
        `Role patch failed: ${formattedErrors.message}`,
        formattedErrors.errors,
        getErrorSuggestion("validation", "role")
      );
    }

    // Handle not found errors
    if (error.message.includes("not found")) {
      return sendNotFound(
        res,
        `Role with ID '${id}' was not found in tenant '${tenantId}'. Please verify the role ID and try again.`
      );
    }

    // Handle role code uniqueness error
    if (error.message && error.message.includes("already exists")) {
      return sendValidationError(
        res,
        "Role patch failed: A role with this code already exists in the tenant.",
        {
          roleCode: error.message,
          suggestion: getErrorSuggestion("duplicate", "role"),
        }
      );
    }

    // Handle permission errors
    if (error.message && error.message.includes("permission")) {
      return sendValidationError(
        res,
        "You do not have permission to update roles in this tenant. Please contact your administrator.",
        {
          suggestion: getErrorSuggestion("permission", "role"),
        }
      );
    }

    // Handle database errors
    if (error.message && error.message.includes("Firestore")) {
      return sendError(
        res,
        "DATABASE_ERROR",
        "Database error occurred while patching role. Please try again.",
        null,
        500
      );
    }

    next(error);
  }
}

/**
 * Normalize permission entries on a role object to ensure consistent client shape.
 * Accepts permission objects or raw strings and returns objects: { id, code, name } where id=module.action
 */
export function normalizeRolePermissions(role) {
  if (!role || typeof role !== "object") return role;
  const perms = role.permissions;
  if (!Array.isArray(perms)) return role;
  const normalized = perms
    .map((p) => {
      if (!p) return null;
      if (typeof p === "string") {
        return { id: p, code: p, name: p };
      }
      const id = p.id || p.permissionId || p.code || p.name || p.permission;
      if (!id) return null;
      return {
        id,
        code: p.code || id,
        name: p.name || p.displayName || id,
      };
    })
    .filter(Boolean);
  // Avoid mutating original reference unexpectedly: shallow clone
  return { ...role, permissions: normalized };
}
