import { parseQueryParams } from "../utilities/query.util.js";
import { sendValidationError } from "../utilities/response.util.js";

/**
 * Middleware to parse and validate query parameters
 */
export function validateQueryParams(options = {}) {
  return (req, res, next) => {
    try {
      // Parse query parameters with the provided options
      req.parsedQuery = parseQueryParams(req.query, options);
      next();
    } catch (error) {
      return sendValidationError(res, error.message);
    }
  };
}

/**
 * Preset middleware for common query parameter configurations
 */

// Basic list queries (pagination + sorting)
export const basicListQuery = validateQueryParams({
  maxLimit: 100,
  defaultLimit: 20,
  allowedSortFields: ["createdAt", "updatedAt", "name", "id"],
});

// Advanced list queries (includes search and filters)
export const advancedListQuery = (config = {}) => {
  return validateQueryParams({
    maxLimit: 100,
    defaultLimit: 20,
    allowedSortFields: [
      "createdAt",
      "updatedAt",
      "name",
      "id",
      ...(config.sortFields || []),
    ],
    allowedFilterFields: config.filterFields || [],
    allowedSearchFields: config.searchFields || [],
    allowedExpands: config.expands || [],
  });
};

// Search-focused queries
export const searchQuery = (searchFields = []) => {
  return validateQueryParams({
    maxLimit: 100,
    defaultLimit: 20,
    allowedSearchFields: searchFields,
    allowedSortFields: ["relevance", "createdAt", "updatedAt"],
  });
};

// Report/analytics queries
export const reportQuery = validateQueryParams({
  maxLimit: 1000,
  defaultLimit: 100,
  allowedSortFields: ["date", "count", "total", "createdAt"],
  allowedFilterFields: ["startDate", "endDate", "status", "type"],
});

// Export queries (higher limits)
export const exportQuery = (config = {}) => {
  return validateQueryParams({
    maxLimit: 10000,
    defaultLimit: 1000,
    allowedSortFields: [
      "createdAt",
      "updatedAt",
      "name",
      "id",
      ...(config.sortFields || []),
    ],
    allowedFilterFields: config.filterFields || [],
    allowedSearchFields: config.searchFields || [],
  });
};

// ---------------------------------------------------------------------------
// Backward-compatible named exports expected by some routes
// ---------------------------------------------------------------------------

// Simple aliases to existing presets
export const validatePagination = basicListQuery;

export const validateExport = exportQuery();

// Generic search validator (no field allow-list unless provided per-route)
export const validateSearch = validateQueryParams({
  maxLimit: 100,
  defaultLimit: 20,
  allowedSortFields: ["relevance", "createdAt", "updatedAt"],
});

// Basic bulk operation validator
export function validateBulkOperation(req, res, next) {
  try {
    const { operation, data } = req.body || {};
    const allowed = new Set(["create", "update", "delete"]);
    if (!allowed.has(operation)) {
      return res.status(400).json({
        success: false,
        error: `Invalid bulk operation: ${operation}`,
        allowed: Array.from(allowed),
      });
    }
    if (!Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: "Bulk 'data' must be an array",
      });
    }
    next();
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}
