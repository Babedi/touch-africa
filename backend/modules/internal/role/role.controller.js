/**
 * Internal Role Controller
 * HTTP handlers for internal role operations
 */

import {
  InternalRoleSchema,
  InternalRoleUpdateSchema,
  isValidInternalRoleId,
} from "./role.validation.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../middleware/permission.middleware.js";
import {
  createInternalRoleService,
  getInternalRoleByIdService,
  updateInternalRoleByIdService,
  deleteInternalRoleByIdService,
  listInternalRolesService,
  searchInternalRolesService,
  bulkInternalRolesService,
  exportInternalRolesService,
  getInternalRolesStatsService,
} from "./role.service.js";
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  handleZodError,
  sendList,
} from "../../../utilities/response.util.js";
import {
  formatPaginatedResponse,
  createExportResponse,
} from "../../../utilities/query.util.js";

// Define authorization roles
// Permissions defined in route handlers directly
// Permissions defined in route handlers directly

/**
 * Create internal role handler
 */
export async function createInternalRoleHandler(req, res, next) {
  try {
    console.log(
      "🔧 Creating role with data:",
      JSON.stringify(req.body, null, 2)
    );

    // Get actor for service layer
    const actor = req.admin?.id || req.user?.id || "system";

    const validatedData = InternalRoleSchema.parse(req.body);

    console.log("✅ Validation passed, creating role...");

    const createdRole = await createInternalRoleService(validatedData, actor);
    const normalized = normalizeRolePermissions(createdRole);

    return sendSuccess(
      res,
      normalized,
      "Internal role created successfully",
      201
    );
  } catch (error) {
    console.error("❌ Role creation error:", error);
    if (error.name === "ZodError") {
      console.error(
        "❌ Zod validation errors:",
        JSON.stringify(error.errors, null, 2)
      );
      return sendValidationError(res, "Validation failed", error.errors);
    }

    // Handle role code uniqueness error
    if (error.message && error.message.includes("already exists")) {
      return sendValidationError(res, error.message);
    }

    next(error);
  }
}

/**
 * Get internal role by ID handler
 */
export async function getInternalRoleByIdHandler(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidInternalRoleId(id)) {
      return sendValidationError(res, "Invalid role ID format");
    }

    const role = await getInternalRoleByIdService(id);
    const normalized = normalizeRolePermissions(role);
    return sendSuccess(res, normalized, "Internal role retrieved successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * Update internal role handler
 */
export async function updateInternalRoleByIdHandler(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidInternalRoleId(id)) {
      return sendValidationError(res, "Invalid role ID format");
    }

    console.log(
      "🔧 Role Update Request Body:",
      JSON.stringify(req.body, null, 2)
    );
    console.log("🔧 Permissions array length:", req.body.permissions?.length);
    console.log("🔧 First 5 permissions:", req.body.permissions?.slice(0, 5));

    const validatedData = InternalRoleUpdateSchema.parse(req.body);
    const actor = req.admin?.id || req.user?.id || "system";

    const updatedRole = await updateInternalRoleByIdService(
      id,
      validatedData,
      actor
    );
    const normalized = normalizeRolePermissions(updatedRole);
    return sendSuccess(res, normalized, "Internal role updated successfully");
  } catch (error) {
    console.error("🚨 Role update error:", error);
    if (error.name === "ZodError") {
      console.error(
        "🚨 Zod validation errors:",
        JSON.stringify(error.errors, null, 2)
      );
      return sendValidationError(res, error.errors);
    }
    next(error);
  }
}

/**
 * Delete internal role handler
 */
export async function deleteInternalRoleByIdHandler(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidInternalRoleId(id)) {
      return sendValidationError(res, "Invalid role ID format");
    }

    await deleteInternalRoleByIdService(id);

    return sendSuccess(
      res,
      { message: "Internal role deleted successfully" },
      "Internal role deleted successfully"
    );
  } catch (error) {
    next(error);
  }
}

/**
 * List all internal roles handler
 */
export async function listInternalRolesHandler(req, res, next) {
  try {
    const result = await listInternalRolesService(req.parsedQuery);
    const dataNorm = Array.isArray(result.data)
      ? result.data.map(normalizeRolePermissions)
      : [];
    return sendList(
      res,
      dataNorm,
      result.pagination,
      "Internal roles retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Search internal roles handler
 */
export async function searchInternalRolesHandler(req, res, next) {
  try {
    const result = await searchInternalRolesService(req.parsedQuery);
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
 * Bulk operations for internal roles handler
 */
export async function bulkInternalRolesHandler(req, res, next) {
  try {
    const { operation, data, filters } = req.body;
    const actor =
      req.admin?.id || req.user?.id || req.user?.email || "anonymous";

    const result = await bulkInternalRolesService(
      operation,
      data,
      filters,
      actor
    );

    return sendSuccess(res, result, `Bulk ${operation} completed successfully`);
  } catch (error) {
    next(error);
  }
}

/**
 * Export internal roles handler
 */
export async function exportInternalRolesHandler(req, res, next) {
  try {
    const { format = "csv" } = req.query;
    // exportInternalRolesService expects (format, queryParams)
    const result = await exportInternalRolesService(format, req.parsedQuery);

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
 * Get internal roles statistics handler
 */
export async function getInternalRolesStatsHandler(req, res, next) {
  try {
    const stats = await getInternalRolesStatsService(req.parsedQuery);

    return sendSuccess(res, stats, "Role statistics retrieved successfully");
  } catch (error) {
    next(error);
  }
}

/**
 * Partially update internal role by ID handler
 */
export async function patchInternalRoleHandler(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidInternalRoleId(id)) {
      return sendValidationError(res, "Invalid role ID");
    }

    // Validate partial update data
    const parsed = InternalRoleUpdateSchema.partial().parse(req.body);

    const updatedRole = await updateInternalRoleByIdService(id, parsed);
    const normalized = normalizeRolePermissions(updatedRole);
    return sendSuccess(
      res,
      normalized,
      "Internal role partially updated successfully"
    );
  } catch (error) {
    if (error.name === "ZodError") {
      return handleZodError(res, error);
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
