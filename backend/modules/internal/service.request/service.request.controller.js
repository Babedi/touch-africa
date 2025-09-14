import { z } from "zod";
import {
  ServiceRequestSchema,
  ServiceRequestUpdateSchema,
  newServiceRequestId,
} from "./service.request.validation.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../middleware/permission.middleware.js";
import {
  serviceCreateServiceRequest,
  serviceGetServiceRequestById,
  serviceUpdateServiceRequestById,
  serviceDeleteServiceRequestById,
  serviceGetAllServiceRequests,
  listServiceRequestsService,
  searchServiceRequestsService,
  bulkServiceRequestsService,
  exportServiceRequestsService,
  getServiceRequestsStatsService,
} from "./service.request.service.js";
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  handleZodError,
} from "../../../utilities/response.util.js";

// Permissions defined in route handlers directly
// Permissions defined in route handlers directly

export async function createServiceRequestHandler(req, res, next) {
  try {
    const parsed = ServiceRequestSchema.parse(req.body);
    const id = newServiceRequestId();
    const actor =
      req.admin?.id || req.user?.id || req.user?.email || "anonymous";
    const model = { id, ...parsed };
    const data = await serviceCreateServiceRequest(model, actor);
    return sendSuccess(res, data, "Service request created successfully", 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return handleZodError(res, err);
    }
    next(err);
  }
}

export async function getServiceRequestByIdHandler(req, res, next) {
  try {
    const data = await serviceGetServiceRequestById(req.params.id);
    if (!data) {
      return sendNotFound(res, "Service request not found");
    }
    return sendSuccess(res, data, "Service request retrieved successfully");
  } catch (err) {
    next(err);
  }
}

export async function updateServiceRequestByIdHandler(req, res, next) {
  try {
    const parsed = ServiceRequestUpdateSchema.parse(req.body);
    const data = await serviceUpdateServiceRequestById(req.params.id, parsed);
    return sendSuccess(res, data, "Service request updated successfully");
  } catch (err) {
    if (err instanceof z.ZodError) {
      return handleZodError(res, err);
    }
    next(err);
  }
}

export async function deleteServiceRequestByIdHandler(req, res, next) {
  try {
    await serviceDeleteServiceRequestById(req.params.id);
    return sendSuccess(
      res,
      { message: "Service request deleted successfully" },
      "Service request deleted successfully"
    );
  } catch (err) {
    next(err);
  }
}

export async function listServiceRequestsHandler(req, res, next) {
  try {
    const result = await listServiceRequestsService(req.query);
    return sendSuccess(
      res,
      result.data,
      "Service requests retrieved successfully",
      200,
      result.pagination
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Search service requests with enhanced query capabilities
 * GET /internal/service-requests/search
 */
export async function searchServiceRequestsHandler(req, res, next) {
  try {
    const result = await searchServiceRequestsService(req.query);
    return sendSuccess(
      res,
      result.data,
      "Service request search completed successfully",
      200,
      result.pagination
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk operations for service requests
 * POST /internal/service-requests/bulk
 */
export async function bulkServiceRequestsHandler(req, res, next) {
  try {
    const { operation, data } = req.body;

    if (!operation || !data) {
      return sendValidationError(
        res,
        "Operation and data are required for bulk operations"
      );
    }

    const result = await bulkServiceRequestsService(operation, data);

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
}

/**
 * Export service requests data
 * GET /internal/service-requests/export
 */
export async function exportServiceRequestsHandler(req, res, next) {
  try {
    const { format = "json" } = req.query;
    const result = await exportServiceRequestsService(format, req.query);

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
}

/**
 * Get service request statistics and analytics
 * GET /internal/service-requests/stats
 */
export async function getServiceRequestsStatsHandler(req, res, next) {
  try {
    const stats = await getServiceRequestsStatsService();
    return sendSuccess(
      res,
      stats,
      "Service request statistics retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
}

export async function patchServiceRequestByIdHandler(req, res, next) {
  try {
    const parsed = ServiceRequestUpdateSchema.partial().parse(req.body);
    const data = await serviceUpdateServiceRequestById(req.params.id, parsed);
    return sendSuccess(
      res,
      data,
      "Service request partially updated successfully"
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return handleZodError(res, err);
    }
    next(err);
  }
}
