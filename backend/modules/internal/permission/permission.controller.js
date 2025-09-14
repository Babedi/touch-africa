import {
  InternalPermissionSchema,
  InternalPermissionUpdateSchema,
} from "./permission.validation.js";
import {
  createInternalPermissionService,
  getInternalPermissionByIdService,
  updateInternalPermissionByIdService,
  deleteInternalPermissionByIdService,
  listInternalPermissionsService,
  searchInternalPermissionsService,
  bulkInternalPermissionsService,
  exportInternalPermissionsService,
  getInternalPermissionsStatsService,
} from "./permission.service.js";
import {
  sendSuccess,
  sendValidationError,
  sendNotFound,
  handleZodError,
  sendList,
} from "../../../utilities/response.util.js";

/**
 * @desc Create a new internal permission
 * @route POST /internal/permission
 * @access Private
 */
export const createInternalPermissionController = async (req, res, next) => {
  try {
    // Validate request body
    const validatedData = InternalPermissionSchema.parse(req.body);

    // Get actor from authenticated user
    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";

    // Create internal permission
    const newInternalPermission = await createInternalPermissionService(
      validatedData,
      actor
    );

    return sendSuccess(
      res,
      newInternalPermission,
      "Internal permission created successfully",
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
 * @desc Get internal permission by ID
 * @route GET /internal/permission/:id
 * @access Private
 */
export const getInternalPermissionController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const internalPermission = await getInternalPermissionByIdService(id);

    if (!internalPermission) {
      return sendNotFound(res, "Internal permission not found");
    }

    return sendSuccess(
      res,
      internalPermission,
      "Internal permission retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update internal permission by ID
 * @route PUT /internal/permission/:id
 * @access Private
 */
export const updateInternalPermissionController = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate request body
    const validatedData = InternalPermissionUpdateSchema.parse(req.body);

    // Get actor from authenticated user
    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";

    // Update internal permission
    const updatedInternalPermission = await updateInternalPermissionByIdService(
      id,
      validatedData,
      actor
    );

    if (!updatedInternalPermission) {
      return sendNotFound(res, "Internal permission not found");
    }

    return sendSuccess(
      res,
      updatedInternalPermission,
      "Internal permission updated successfully"
    );
  } catch (error) {
    if (error.name === "ZodError") {
      return handleZodError(res, error);
    }
    next(error);
  }
};

/**
 * @desc Delete internal permission by ID
 * @route DELETE /internal/permission/:id
 * @access Private
 */
export const deleteInternalPermissionController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await deleteInternalPermissionByIdService(id);

    if (!deleted) {
      return sendNotFound(res, "Internal permission not found");
    }

    return sendSuccess(
      res,
      { message: "Internal permission deleted successfully" },
      "Internal permission deleted successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Partially update internal permission by ID
 * @route PATCH /internal/permissions/:id
 * @access Private
 */
export const patchInternalPermissionController = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate request body for partial update
    const validatedData = InternalPermissionUpdateSchema.partial().parse(
      req.body
    );

    // Get actor from authenticated user
    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";

    // Update internal permission
    const updatedInternalPermission = await updateInternalPermissionByIdService(
      id,
      validatedData,
      actor
    );

    if (!updatedInternalPermission) {
      return sendNotFound(res, "Internal permission not found");
    }

    return sendSuccess(
      res,
      updatedInternalPermission,
      "Internal permission partially updated successfully"
    );
  } catch (error) {
    if (error.name === "ZodError") {
      return handleZodError(res, error);
    }
    next(error);
  }
};

/**
 * @desc Get all internal permissions with query support
 * @route GET /internal/permissions
 * @access Private
 */
export const getAllInternalPermissionsController = async (req, res, next) => {
  try {
    const result = await listInternalPermissionsService(req.query);
    // Return with pagination metadata so clients can iterate if needed
    return sendList(
      res,
      result.data,
      result.pagination,
      "Internal permissions retrieved successfully",
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Search internal permissions with enhanced query capabilities
 * @route GET /internal/permissions/search
 */
export const searchInternalPermissionsController = async (req, res, next) => {
  try {
    const result = await searchInternalPermissionsService(req.query);

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
 * Bulk operations for internal permissions
 * @route POST /internal/permissions/bulk
 */
export const bulkInternalPermissionsController = async (req, res, next) => {
  try {
    const { operation, data } = req.body;

    if (!operation || !data) {
      return sendValidationError(
        res,
        "Operation and data are required for bulk operations"
      );
    }

    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";
    const result = await bulkInternalPermissionsService(operation, data, actor);

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
 * Export internal permissions data
 * @route GET /internal/permissions/export
 */
export const exportInternalPermissionsController = async (req, res, next) => {
  try {
    const { format = "json" } = req.query;
    const result = await exportInternalPermissionsService(format, req.query);

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
 * Get internal permissions statistics and analytics
 * @route GET /internal/permissions/stats
 */
export const getInternalPermissionsStatsController = async (req, res, next) => {
  try {
    const stats = await getInternalPermissionsStatsService();

    return sendSuccess(
      res,
      stats,
      "Permission statistics retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};
