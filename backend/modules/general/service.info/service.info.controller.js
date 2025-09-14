import { z } from "zod";
import {
  ServiceInfoSchema,
  ServiceInfoUpdateSchema,
} from "./service.info.validation.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../middleware/permission.middleware.js";
import {
  serviceGetServiceInfo,
  serviceUpdateServiceInfo,
  listServiceInfoService,
  searchServiceInfoService,
  bulkServiceInfoService,
  exportServiceInfoService,
  getServiceInfoStatsService,
} from "./service.info.service.js";
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  handleZodError,
} from "../../../utilities/response.util.js";

// Permissions defined in route handlers directly
// Permissions defined in route handlers directly

export async function getServiceInfoHandler(req, res, next) {
  try {
    const result = await listServiceInfoService(req.query);
    return sendSuccess(
      res,
      result.data,
      "Service information retrieved successfully",
      200,
      result.pagination
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Search service info with enhanced query capabilities
 * GET /general/service-info/search
 */
export async function searchServiceInfoHandler(req, res, next) {
  try {
    const result = await searchServiceInfoService(req.query);
    return sendSuccess(
      res,
      result.data,
      "Service info search completed successfully",
      200,
      result.pagination
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Bulk operations for service info
 * POST /general/service-info/bulk
 */
export async function bulkServiceInfoHandler(req, res, next) {
  try {
    const { operation, data } = req.body;

    if (!operation || !data) {
      return sendValidationError(
        res,
        "Operation and data are required for bulk operations"
      );
    }

    const result = await bulkServiceInfoService(operation, data);

    const statusCode = result.success ? 200 : 207; // 207 for partial success
    return sendSuccess(
      res,
      result,
      `Bulk ${operation} operation completed`,
      statusCode
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Export service info data
 * GET /general/service-info/export
 */
export async function exportServiceInfoHandler(req, res, next) {
  try {
    const { format = "json" } = req.query;
    const result = await exportServiceInfoService(format, req.query);

    // Set appropriate headers for file download
    res.setHeader("Content-Type", result.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`
    );

    return res.send(result.data);
  } catch (err) {
    next(err);
  }
}

/**
 * Get service info statistics and analytics
 * GET /general/service-info/stats
 */
export async function getServiceInfoStatsHandler(req, res, next) {
  try {
    const stats = await getServiceInfoStatsService();
    return sendSuccess(
      res,
      stats,
      "Service info statistics retrieved successfully"
    );
  } catch (err) {
    next(err);
  }
}

export async function updateServiceInfoHandler(req, res, next) {
  try {
    console.log("🔍 Service Info Update - Request body type:", typeof req.body);
    console.log(
      "🔍 Service Info Update - Request body keys:",
      Object.keys(req.body || {})
    );
    console.log(
      "🔍 Service Info Update - Request body sample:",
      JSON.stringify(req.body).substring(0, 200) + "..."
    );

    const parsed = ServiceInfoUpdateSchema.parse(req.body);
    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";
    const data = await serviceUpdateServiceInfo(parsed, actor);
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.log("❌ Service Info Validation Error:", err.errors);
      return res
        .status(400)
        .json({ error: "ValidationError", details: err.errors });
    }
    console.log("❌ Service Info General Error:", err.message);
    next(err);
  }
}

export async function patchServiceInfoHandler(req, res, next) {
  try {
    console.log("🔍 Service Info Patch - Request body type:", typeof req.body);
    console.log(
      "🔍 Service Info Patch - Request body keys:",
      Object.keys(req.body || {})
    );
    console.log(
      "🔍 Service Info Patch - Request body sample:",
      JSON.stringify(req.body).substring(0, 200) + "..."
    );

    const parsed = ServiceInfoUpdateSchema.partial().parse(req.body);
    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";
    const data = await serviceUpdateServiceInfo(parsed, actor);
    return sendSuccess(
      res,
      data,
      "Service information partially updated successfully"
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.log("❌ Service Info Patch Validation Error:", err.errors);
      return handleZodError(res, err);
    }
    console.log("❌ Service Info Patch General Error:", err.message);
    next(err);
  }
}
