import {
  ExternalPermissionSchema,
  ExternalPermissionUpdateSchema,
} from "./permission.validation.js";
import {
  createExternalPermissionService,
  getExternalPermissionByIdService,
  updateExternalPermissionByIdService,
  deleteExternalPermissionByIdService,
  listExternalPermissionsService,
  searchExternalPermissionsService,
  bulkExternalPermissionsService,
  exportExternalPermissionsService,
  getExternalPermissionsStatsService,
} from "./permission.service.js";
import {
  sendSuccess,
  sendValidationError,
  sendValidationErrorEnhanced,
  sendNotFound,
  sendError,
  handleZodError,
  sendList,
} from "../../../../utilities/response.util.js";
import {
  formatModuleValidationErrors,
  formatBusinessValidationErrors,
  getErrorSuggestion,
} from "../../../../utilities/validation.util.js";

/**
 * @desc Create a new external permission
 * @route POST /external/permission
 * @access Private
 */
export const createExternalPermissionController = async (req, res, next) => {
  try {
    // Get tenant ID from user context or request parameters
    const tenantId =
      req.user?.tenantId || req.params?.tenantId || req.query?.tenantId;

    if (!tenantId) {
      return sendValidationError(
        res,
        "Tenant ID is required to create a permission.",
        {
          tenantId:
            "Tenant ID must be provided in user context, parameters, or query",
        }
      );
    }

    // Validate request body
    const validatedData = ExternalPermissionSchema.parse(req.body);

    // Get actor from authenticated user
    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";

    // Create external permission
    const newExternalPermission = await createExternalPermissionService(
      validatedData,
      tenantId,
      actor
    );

    return sendSuccess(
      res,
      newExternalPermission,
      "External permission created successfully",
      201
    );
  } catch (error) {
    if (error.name === "ZodError") {
      const formattedErrors = formatModuleValidationErrors(error, "permission");
      return sendValidationErrorEnhanced(
        res,
        `Permission creation failed: ${formattedErrors.message}`,
        formattedErrors.errors,
        getErrorSuggestion("validation", "permission")
      );
    }

    // Handle permission code uniqueness error
    if (error.message && error.message.includes("already exists")) {
      return sendValidationError(
        res,
        "Permission creation failed: A permission with this code already exists in the tenant.",
        {
          permissionCode: error.message,
          suggestion: getErrorSuggestion("duplicate", "permission"),
        }
      );
    }

    // Handle authorization errors
    if (error.message && error.message.includes("permission")) {
      return sendValidationError(
        res,
        "You do not have permission to create permissions in this tenant. Please contact your administrator.",
        {
          suggestion: getErrorSuggestion("permission", "permission"),
        }
      );
    }

    // Handle database errors
    if (error.message && error.message.includes("Firestore")) {
      return sendError(
        res,
        "DATABASE_ERROR",
        "Database error occurred while creating permission. Please try again.",
        null,
        500
      );
    }

    next(error);
  }
};

/**
 * @desc Get external permission by ID
 * @route GET /external/permission/:id
 * @access Private
 */
export const getExternalPermissionController = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get tenant ID from user context or request parameters
    const tenantId =
      req.user?.tenantId || req.params?.tenantId || req.query?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: "Tenant ID is required",
        code: "NO_TENANT_ID",
      });
    }

    const externalPermission = await getExternalPermissionByIdService(
      id,
      tenantId
    );

    if (!externalPermission) {
      return sendNotFound(res, "External permission not found");
    }

    return sendSuccess(
      res,
      externalPermission,
      "External permission retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update external permission by ID
 * @route PUT /external/permission/:id
 * @access Private
 */
export const updateExternalPermissionController = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate request body
    const validatedData = ExternalPermissionUpdateSchema.parse(req.body);

    // Get tenant ID from user context or request parameters
    const tenantId =
      req.user?.tenantId || req.params?.tenantId || req.query?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: "Tenant ID is required",
        code: "NO_TENANT_ID",
      });
    }

    // Get actor from authenticated user
    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";

    // Update external permission
    const updatedExternalPermission = await updateExternalPermissionByIdService(
      id,
      tenantId,
      validatedData,
      actor
    );

    if (!updatedExternalPermission) {
      return sendNotFound(res, "External permission not found");
    }

    return sendSuccess(
      res,
      updatedExternalPermission,
      "External permission updated successfully"
    );
  } catch (error) {
    if (error.name === "ZodError") {
      return handleZodError(res, error);
    }
    next(error);
  }
};

/**
 * @desc Delete external permission by ID
 * @route DELETE /external/permission/:id
 * @access Private
 */
export const deleteExternalPermissionController = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get tenant ID from user context or request parameters
    const tenantId =
      req.user?.tenantId || req.params?.tenantId || req.query?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: "Tenant ID is required",
        code: "NO_TENANT_ID",
      });
    }

    const deleted = await deleteExternalPermissionByIdService(id, tenantId);

    if (!deleted) {
      return sendNotFound(res, "External permission not found");
    }

    return sendSuccess(
      res,
      { message: "External permission deleted successfully" },
      "External permission deleted successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Partially update external permission by ID
 * @route PATCH /external/permissions/:id
 * @access Private
 */
export const patchExternalPermissionController = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate request body for partial update
    const validatedData = ExternalPermissionUpdateSchema.partial().parse(
      req.body
    );

    // Get actor from authenticated user
    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";

    // Update external permission
    const updatedExternalPermission = await updateExternalPermissionByIdService(
      id,
      validatedData,
      actor
    );

    if (!updatedExternalPermission) {
      return sendNotFound(res, "External permission not found");
    }

    return sendSuccess(
      res,
      updatedExternalPermission,
      "External permission partially updated successfully"
    );
  } catch (error) {
    if (error.name === "ZodError") {
      return handleZodError(res, error);
    }
    next(error);
  }
};

/**
 * @desc Get all external permissions with query support
 * @route GET /external/permissions
 * @access Private
 */
export const getAllExternalPermissionsController = async (req, res, next) => {
  try {
    // Get tenant ID from user context or request parameters
    const tenantId =
      req.user?.tenantId || req.params?.tenantId || req.query?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: "Tenant ID is required",
        code: "NO_TENANT_ID",
      });
    }

    const result = await listExternalPermissionsService(tenantId, req.query);
    // Return with pagination metadata so clients can iterate if needed
    return sendList(
      res,
      result.data,
      result.pagination,
      "External permissions retrieved successfully",
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Search external permissions with enhanced query capabilities
 * @route GET /external/permissions/search
 */
export const searchExternalPermissionsController = async (req, res, next) => {
  try {
    // Get tenant ID from user context or request parameters
    const tenantId =
      req.user?.tenantId || req.params?.tenantId || req.query?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: "Tenant ID is required",
        code: "NO_TENANT_ID",
      });
    }

    const result = await searchExternalPermissionsService(tenantId, req.query);

    return sendSuccess(
      res,
      result.data,
      "Permission search completed successfully",
      200,
      result.pagination
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk operations for external permissions
 * @route POST /external/permissions/bulk
 */
export const bulkExternalPermissionsController = async (req, res, next) => {
  try {
    const { operation, data } = req.body;

    if (!operation || !data) {
      return sendValidationError(
        res,
        "Operation and data are required for bulk operations"
      );
    }

    // Get tenant ID from user context or request parameters
    const tenantId =
      req.user?.tenantId || req.params?.tenantId || req.query?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: "Tenant ID is required",
        code: "NO_TENANT_ID",
      });
    }

    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";
    const result = await bulkExternalPermissionsService(
      operation,
      tenantId,
      data,
      actor
    );

    const statusCode = result.success ? 200 : 207; // 207 for partial success
    return sendSuccess(
      res,
      result,
      `Bulk ${operation} operation completed`,
      statusCode
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Export external permissions data
 * @route GET /external/permissions/export
 */
export const exportExternalPermissionsController = async (req, res, next) => {
  try {
    // Get tenant ID from user context or request parameters
    const tenantId =
      req.user?.tenantId || req.params?.tenantId || req.query?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: "Tenant ID is required",
        code: "NO_TENANT_ID",
      });
    }

    const { format = "json" } = req.query;
    const result = await exportExternalPermissionsService(
      tenantId,
      format,
      req.query
    );

    // Set appropriate headers for file download
    res.setHeader("Content-Type", result.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`
    );

    return res.send(result.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Get external permissions statistics and analytics
 * @route GET /external/permissions/stats
 */
export const getExternalPermissionsStatsController = async (req, res, next) => {
  try {
    // Get tenant ID from user context or request parameters
    const tenantId =
      req.user?.tenantId || req.params?.tenantId || req.query?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: "Tenant ID is required",
        code: "NO_TENANT_ID",
      });
    }

    const stats = await getExternalPermissionsStatsService(tenantId);

    return sendSuccess(
      res,
      stats,
      "Permission statistics retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};
