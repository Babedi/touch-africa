import {
  StandardPermissionSchema,
  StandardPermissionUpdateSchema,
} from "./standard.permission.validation.js";
import {
  createStandardPermissionService,
  getStandardPermissionByIdService,
  updateStandardPermissionByIdService,
  deleteStandardPermissionByIdService,
  listStandardPermissionsService,
  searchStandardPermissionsService,
  bulkStandardPermissionsService,
  exportStandardPermissionsService,
  getStandardPermissionsStatsService,
} from "./standard.permission.service.js";
import {
  sendSuccess,
  sendValidationError,
  sendNotFound,
  handleZodError,
  sendList,
} from "../../../../utilities/response.util.js";

/**
 * @desc Create a new standard permission
 * @route POST /permissions
 * @access Private
 */
export const createStandardPermissionController = async (req, res, next) => {
  try {
    // Validate request body
    const validatedData = StandardPermissionSchema.parse(req.body);

    // Get actor from authenticated user
    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";

    // Create standard permission
    const newStandardPermission = await createStandardPermissionService(
      validatedData,
      actor
    );

    return sendSuccess(
      res,
      newStandardPermission,
      "Standard permission created successfully",
      201
    );
  } catch (error) {
    if (error.name === "ZodError") {
      return handleZodError(res, error);
    }
    next(error);
  }
};

/**
 * @desc Get standard permission by ID
 * @route GET /permissions/:id
 * @access Private
 */
export const getStandardPermissionController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const standardPermission = await getStandardPermissionByIdService(id);

    if (!standardPermission) {
      return sendNotFound(res, "Standard permission not found");
    }

    return sendSuccess(
      res,
      standardPermission,
      "Standard permission retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update standard permission by ID
 * @route PUT /permissions/:id
 * @access Private
 */
export const updateStandardPermissionController = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate request body
    const validatedData = StandardPermissionUpdateSchema.parse(req.body);

    // Get actor from authenticated user
    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";

    // Update standard permission
    const updatedStandardPermission = await updateStandardPermissionByIdService(
      id,
      validatedData,
      actor
    );

    if (!updatedStandardPermission) {
      return sendNotFound(res, "Standard permission not found");
    }

    return sendSuccess(
      res,
      updatedStandardPermission,
      "Standard permission updated successfully"
    );
  } catch (error) {
    if (error.name === "ZodError") {
      return handleZodError(res, error);
    }
    next(error);
  }
};

/**
 * @desc Delete standard permission by ID
 * @route DELETE /permissions/:id
 * @access Private
 */
export const deleteStandardPermissionController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await deleteStandardPermissionByIdService(id);

    if (!deleted) {
      return sendNotFound(res, "Standard permission not found");
    }

    return sendSuccess(
      res,
      { message: "Standard permission deleted successfully" },
      "Standard permission deleted successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Partially update standard permission by ID
 * @route PATCH /permissions/:id
 * @access Private
 */
export const patchStandardPermissionController = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate request body for partial update
    const validatedData = StandardPermissionUpdateSchema.partial().parse(
      req.body
    );

    // Get actor from authenticated user
    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";

    // Update standard permission
    const updatedStandardPermission = await updateStandardPermissionByIdService(
      id,
      validatedData,
      actor
    );

    if (!updatedStandardPermission) {
      return sendNotFound(res, "Standard permission not found");
    }

    return sendSuccess(
      res,
      updatedStandardPermission,
      "Standard permission partially updated successfully"
    );
  } catch (error) {
    if (error.name === "ZodError") {
      return handleZodError(res, error);
    }
    next(error);
  }
};

/**
 * Bulk operations for standard permissions
 * @route POST /permissions/bulk
 */
export const bulkStandardPermissionsController = async (req, res, next) => {
  try {
    const { operation, data } = req.body;

    if (!operation || !data) {
      return sendValidationError(
        res,
        "Operation and data are required for bulk operations"
      );
    }

    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";
    const result = await bulkStandardPermissionsService(operation, data, actor);

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
 * Export standard permissions data
 * @route GET /permissions/export
 */
export const exportStandardPermissionsController = async (req, res, next) => {
  try {
    const { format = "json" } = req.query;
    const result = await exportStandardPermissionsService(format, req.query);

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
 * Get standard permissions statistics and analytics
 * @route GET /permissions/stats
 */
export const getStandardPermissionsStatsController = async (req, res, next) => {
  try {
    const stats = await getStandardPermissionsStatsService();

    return sendSuccess(
      res,
      stats,
      "Permission statistics retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get all standard permissions (global, no tenant ID required)
 * @route GET /permissions
 * @access Private
 */
export const getAllStandardPermissionsController = async (req, res, next) => {
  try {
    // Call service for global standard permissions
    const result = await listStandardPermissionsService(req.query);
    // Return with pagination metadata so clients can iterate if needed
    return sendList(
      res,
      result.data,
      result.pagination,
      "Standard permissions retrieved successfully",
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Search standard permissions (global, no tenant ID required)
 * @route GET /permissions/search
 * @access Private
 */
export const searchStandardPermissionsController = async (req, res, next) => {
  try {
    // Call service for global standard permissions
    const result = await searchStandardPermissionsService(req.query);

    return sendSuccess(
      res,
      result.data,
      "Standard permission search completed successfully",
      200,
      result.pagination
    );
  } catch (error) {
    next(error);
  }
};
