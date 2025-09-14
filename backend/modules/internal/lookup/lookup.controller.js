import {
  createLookupService,
  getLookupService,
  updateLookupService,
  deleteLookupService,
  getAllLookupsService,
  listLookupsService,
  searchLookupsService,
  bulkLookupsService,
  exportLookupsService,
  getLookupsStatsService,
} from "./lookup.service.js";
import {
  sendSuccess,
  sendList,
  sendError,
  sendNotFound,
  sendValidationError,
} from "../../../utilities/response.util.js";

// Create lookup
export const createLookupController = async (req, res, next) => {
  try {
    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";
    const created = await createLookupService(req.body, actor);
    return sendSuccess(res, created, "Lookup created successfully", 201);
  } catch (error) {
    next(error);
  }
};

// Get lookup by ID
export const getLookupController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await getLookupService(id);
    if (!item) return sendNotFound(res, "Lookup", id);
    return sendSuccess(res, item, "Lookup retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// Update lookup by ID (full)
export const updateLookupController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";
    const updated = await updateLookupService(id, req.body, actor);
    return sendSuccess(res, updated, "Lookup updated successfully");
  } catch (error) {
    if (error?.message?.includes("not found"))
      return sendNotFound(res, "Lookup", req.params?.id);
    next(error);
  }
};

// Patch lookup by ID (partial)
export const patchLookupController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actor = req.admin?.id || req.user?.id || req.user?.email || "system";
    const updated = await updateLookupService(id, req.body, actor);
    return sendSuccess(res, updated, "Lookup updated successfully");
  } catch (error) {
    if (error?.message?.includes("not found"))
      return sendNotFound(res, "Lookup", req.params?.id);
    next(error);
  }
};

// Delete lookup by ID
export const deleteLookupController = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteLookupService(id);
    return sendSuccess(res, { id }, "Lookup deleted successfully");
  } catch (error) {
    next(error);
  }
};

// List lookups with pagination & sorting
export const getAllLookupsController = async (req, res, next) => {
  try {
    const result = await listLookupsService(req.query);
    return sendList(
      res,
      result.data,
      result.pagination,
      "Lookups retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Search lookups
export const searchLookupsController = async (req, res, next) => {
  try {
    const result = await searchLookupsService(req.query);
    return sendList(
      res,
      result.data,
      result.pagination,
      "Lookup search completed successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Bulk operations
export const bulkLookupsController = async (req, res, next) => {
  try {
    const { operation, data } = req.body || {};
    if (!operation || !data)
      return sendValidationError(
        res,
        "Operation and data are required for bulk operations"
      );
    const result = await bulkLookupsService(operation, data);
    const statusCode = result?.failed ? 207 : 200;
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

// Export lookups
export const exportLookupsController = async (req, res, next) => {
  try {
    const { format = "json" } = req.query || {};
    const result = await exportLookupsService(format, req.query);
    res.setHeader("Content-Type", result.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`
    );
    return res.status(200).send(result.data);
  } catch (error) {
    next(error);
  }
};

// Stats
export const getLookupsStatsController = async (_req, res, next) => {
  try {
    const stats = await getLookupsStatsService();
    return sendSuccess(res, stats, "Lookup statistics retrieved successfully");
  } catch (error) {
    next(error);
  }
};
