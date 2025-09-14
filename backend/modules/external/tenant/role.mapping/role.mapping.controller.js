import {
  RoleMappingSchema,
  RoleMappingUpdateSchema,
} from "./role.mapping.validation.js";
import {
  createRoleMappingService,
  getRoleMappingByIdService,
  updateRoleMappingByIdService,
  deleteRoleMappingByIdService,
  getAllRoleMappingsService,
  reloadRoleMappingsService,
  listRoleMappingsService,
  searchRoleMappingsService,
  bulkRoleMappingsService,
  exportRoleMappingsService,
  getRoleMappingsStatsService,
} from "./role.mapping.service.js";
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  handleZodError,
} from "../../../utilities/response.util.js";

/**
 * Get current role mappings with comprehensive query support
 */
export const getRoleMappings = async (req, res) => {
  try {
    const result = await listRoleMappingsService(req.query);

    return sendSuccess(
      res,
      result.data,
      "Role mappings retrieved successfully",
      200,
      result.pagination
    );
  } catch (error) {
    console.error("Error getting role mappings:", error);
    return sendError(
      res,
      "FETCH_FAILED",
      "Failed to get role mappings",
      null,
      500
    );
  }
};

/**
 * Search role mappings with enhanced query capabilities
 * GET /external/role-mappings/search
 */
export const searchRoleMappings = async (req, res) => {
  try {
    const result = await searchRoleMappingsService(req.query);
    return sendSuccess(
      res,
      result.data,
      "Role mapping search completed successfully",
      200,
      result.pagination
    );
  } catch (error) {
    console.error("Error searching role mappings:", error);
    return sendError(
      res,
      "SEARCH_FAILED",
      "Failed to search role mappings",
      null,
      500
    );
  }
};

/**
 * Bulk operations for role mappings
 * POST /external/role-mappings/bulk
 */
export const bulkRoleMappings = async (req, res) => {
  try {
    const { operation, data } = req.body;

    if (!operation || !data) {
      return sendValidationError(
        res,
        "Operation and data are required for bulk operations"
      );
    }

    const result = await bulkRoleMappingsService(operation, data);

    const statusCode = result.success ? 200 : 207; // 207 for partial success
    return sendSuccess(
      res,
      result,
      `Bulk ${operation} operation completed`,
      statusCode
    );
  } catch (error) {
    console.error("Error in bulk role mapping operations:", error);
    return sendError(
      res,
      "BULK_FAILED",
      "Failed to execute bulk operation",
      null,
      500
    );
  }
};

/**
 * Export role mappings data
 * GET /external/role-mappings/export
 */
export const exportRoleMappings = async (req, res) => {
  try {
    const { format = "json" } = req.query;
    const result = await exportRoleMappingsService(format, req.query);

    // Set appropriate headers for file download
    res.setHeader("Content-Type", result.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`
    );

    return res.send(result.data);
  } catch (error) {
    console.error("Error exporting role mappings:", error);
    return sendError(
      res,
      "EXPORT_FAILED",
      "Failed to export role mappings",
      null,
      500
    );
  }
};

/**
 * Get role mapping statistics and analytics
 * GET /external/role-mappings/stats
 */
export const getRoleMappingsStats = async (req, res) => {
  try {
    const stats = await getRoleMappingsStatsService();
    return sendSuccess(
      res,
      stats,
      "Role mapping statistics retrieved successfully"
    );
  } catch (error) {
    console.error("Error getting role mapping stats:", error);
    return sendError(
      res,
      "STATS_FAILED",
      "Failed to get role mapping statistics",
      null,
      500
    );
  }
};

/**
 * Update role mappings
 */
export const updateRoleMappings = async (req, res) => {
  try {
    const { mappings } = req.body;

    if (!mappings || typeof mappings !== "object") {
      return sendValidationError(res, "Invalid mappings format");
    }

    // Get actor from authenticated user
    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";

    // Update each mapping
    const updatePromises = Object.entries(mappings).map(
      ([roleName, roleCode]) => {
        const validatedData = RoleMappingSchema.parse({ roleName, roleCode });
        return createRoleMappingService(validatedData, actor);
      }
    );

    await Promise.all(updatePromises);

    const result = await getAllRoleMappingsService();

    return sendSuccess(res, result, "Role mappings updated successfully");
  } catch (error) {
    console.error("Error updating role mappings:", error);
    if (error.name === "ZodError") {
      return handleZodError(res, error);
    }
    return sendError(res, "INTERNAL_ERROR", "Failed to update role mappings");
  }
};

/**
 * Reload role mappings from source
 */
export const reloadRoleMappings = async (req, res) => {
  try {
    const result = await reloadRoleMappingsService();

    return sendSuccess(res, result, "Role mappings reloaded successfully");
  } catch (error) {
    console.error("Error reloading role mappings:", error);
    return sendError(res, "INTERNAL_ERROR", "Failed to reload role mappings");
  }
};

/**
 * Add a single role mapping
 */
export const addRoleMapping = async (req, res) => {
  try {
    // Validate request body
    const validatedData = RoleMappingSchema.parse(req.body);

    // Get actor from authenticated user
    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";

    // Create role mapping
    const newRoleMapping = await createRoleMappingService(validatedData, actor);

    return sendSuccess(
      res,
      newRoleMapping,
      `Mapping added: ${validatedData.roleName} -> ${validatedData.roleCode}`,
      201
    );
  } catch (error) {
    console.error("Error adding role mapping:", error);
    if (error.name === "ZodError") {
      return handleZodError(res, error);
    }
    return sendError(res, "INTERNAL_ERROR", "Failed to add role mapping");
  }
};

/**
 * Remove a role mapping
 */
export const removeRoleMapping = async (req, res) => {
  try {
    const { roleName } = req.params;

    if (!roleName) {
      return sendValidationError(res, "Role name is required");
    }

    const deleted = await deleteRoleMappingByIdService(roleName);

    if (!deleted) {
      return sendNotFound(res, "Role mapping not found");
    }

    return sendSuccess(
      res,
      { message: `Mapping removed: ${roleName}` },
      `Mapping removed: ${roleName}`
    );
  } catch (error) {
    console.error("Error removing role mapping:", error);
    return sendError(res, "INTERNAL_ERROR", "Failed to remove role mapping");
  }
};

/**
 * Get role mapping by ID
 */
export const getRoleMappingById = async (req, res) => {
  try {
    const { id } = req.params;

    const roleMapping = await getRoleMappingByIdService(id);

    if (!roleMapping) {
      return sendNotFound(res, "Role mapping not found");
    }

    return sendSuccess(res, roleMapping, "Role mapping retrieved successfully");
  } catch (error) {
    console.error("Error getting role mapping:", error);
    return sendError(res, "INTERNAL_ERROR", "Failed to get role mapping");
  }
};

/**
 * Update role mapping by ID
 */
export const updateRoleMappingById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate request body
    const validatedData = RoleMappingUpdateSchema.parse(req.body);

    // Get actor from authenticated user
    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";

    // Update role mapping
    const updatedRoleMapping = await updateRoleMappingByIdService(
      id,
      validatedData,
      actor
    );

    if (!updatedRoleMapping) {
      return sendNotFound(res, "Role mapping not found");
    }

    return sendSuccess(
      res,
      updatedRoleMapping,
      "Role mapping updated successfully"
    );
  } catch (error) {
    console.error("Error updating role mapping:", error);
    if (error.name === "ZodError") {
      return handleZodError(res, error);
    }
    return sendError(res, "INTERNAL_ERROR", "Failed to update role mapping");
  }
};

/**
 * Partially update role mapping by ID
 */
export const patchRoleMappingById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate partial update data
    const parsed = RoleMappingUpdateSchema.partial().parse(req.body);

    const updatedRoleMapping = await updateRoleMappingByIdService(id, parsed);

    if (!updatedRoleMapping) {
      return sendNotFound(res, "Role mapping not found");
    }

    return sendSuccess(
      res,
      updatedRoleMapping,
      "Role mapping partially updated successfully"
    );
  } catch (error) {
    console.error("Error partially updating role mapping:", error);
    if (error.name === "ZodError") {
      return handleZodError(res, error);
    }
    return sendError(
      res,
      "INTERNAL_ERROR",
      "Failed to partially update role mapping"
    );
  }
};
