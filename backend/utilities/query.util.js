import { z } from "zod";
// Optional Firestore import for compatibility helpers
import { db } from "../services/firestore.client.js";

/**
 * Query Parameters Utility Module
 * Provides comprehensive search, sort, filter, and pagination functionality
 */

// Validation schemas for query parameters
export const PaginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).default("20"),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const SortSchema = z.object({
  sortBy: z.string().optional(),
  order: z
    .enum(["asc", "desc", "ASC", "DESC"])
    .transform((val) => val.toLowerCase())
    .default("asc"),
});

export const SearchSchema = z.object({
  q: z.string().optional(), // General search query
  search: z.string().optional(), // Alternative search parameter
  searchFields: z.string().optional(), // Comma-separated list of fields to search
});

export const FilterSchema = z.record(z.string(), z.any());

export const QueryParamsSchema = z.object({
  // Pagination
  page: z.string().regex(/^\d+$/).transform(Number).default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).default("20"),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),

  // Sorting
  sortBy: z.string().optional(),
  order: z
    .enum(["asc", "desc", "ASC", "DESC"])
    .transform((val) => val.toLowerCase())
    .default("asc"),

  // Search
  q: z.string().optional(),
  search: z.string().optional(),
  searchFields: z.string().optional(),

  // Date range filters
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  dateField: z.string().optional(),

  // Selection
  fields: z.string().optional(), // Comma-separated list of fields to return
  exclude: z.string().optional(), // Comma-separated list of fields to exclude

  // Expansion
  expand: z.string().optional(), // Comma-separated list of relations to expand
  include: z.string().optional(), // Alternative to expand
});

/**
 * Parse and validate query parameters
 */
export function parseQueryParams(query, options = {}) {
  const {
    maxLimit = 100,
    defaultLimit = 20,
    allowedSortFields = [],
    allowedFilterFields = [],
    allowedSearchFields = [],
    allowedExpands = [],
  } = options;

  try {
    // Parse basic parameters
    const params = QueryParamsSchema.parse(query);

    // Validate and adjust pagination
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(maxLimit, Math.max(1, params.limit || defaultLimit));
    const offset = params.offset || (page - 1) * limit;

    // Parse sorting
    const sort = parseSortParams(
      params.sortBy,
      params.order,
      allowedSortFields
    );

    // Parse search
    const search = parseSearchParams(
      params.q || params.search,
      params.searchFields,
      allowedSearchFields
    );

    // Parse filters
    const filters = parseFilterParams(query, allowedFilterFields);

    // Parse field selection
    const fields = parseFieldSelection(params.fields, params.exclude);

    // Parse expansion
    const expand = parseExpansionParams(
      params.expand || params.include,
      allowedExpands
    );

    // Parse date range
    const dateRange = parseDateRange(
      params.startDate,
      params.endDate,
      params.dateField
    );

    return {
      pagination: {
        page,
        limit,
        offset,
      },
      sort,
      search,
      filters,
      fields,
      expand,
      dateRange,
      raw: query, // Keep raw query for debugging
    };
  } catch (error) {
    throw new Error(`Invalid query parameters: ${error.message}`);
  }
}

/**
 * Parse sort parameters
 */
function parseSortParams(sortBy, order = "asc", allowedFields = []) {
  if (!sortBy) {
    return { field: "createdAt", order: "desc" }; // Default sort
  }

  // Support multiple sort fields (e.g., "name,-createdAt")
  const sortFields = sortBy.split(",").map((field) => {
    const isDesc = field.startsWith("-");
    const fieldName = field.replace(/^-/, "");

    // Validate against allowed fields if specified
    if (allowedFields.length > 0 && !allowedFields.includes(fieldName)) {
      throw new Error(`Invalid sort field: ${fieldName}`);
    }

    return {
      field: fieldName,
      order: isDesc ? "desc" : order,
    };
  });

  return sortFields.length === 1 ? sortFields[0] : sortFields;
}

/**
 * Parse search parameters
 */
function parseSearchParams(searchQuery, searchFields, allowedFields = []) {
  if (!searchQuery) {
    return null;
  }

  const fields = searchFields
    ? searchFields.split(",").filter((field) => {
        return allowedFields.length === 0 || allowedFields.includes(field);
      })
    : allowedFields;

  return {
    query: searchQuery,
    fields: fields.length > 0 ? fields : null,
    type: "contains", // Can be extended to support different search types
  };
}

/**
 * Parse filter parameters
 */
function parseFilterParams(query, allowedFields = []) {
  const filters = {};
  const reservedParams = [
    "page",
    "limit",
    "offset",
    "sortBy",
    "order",
    "q",
    "search",
    "searchFields",
    "fields",
    "exclude",
    "expand",
    "include",
    "startDate",
    "endDate",
    "dateField",
  ];

  Object.keys(query).forEach((key) => {
    // Skip reserved parameters
    if (reservedParams.includes(key)) {
      return;
    }

    // Skip if not in allowed fields
    if (allowedFields.length > 0 && !allowedFields.includes(key)) {
      return;
    }

    // Parse different filter types
    const value = query[key];

    // Handle range filters (e.g., price[min]=100&price[max]=500)
    if (key.includes("[") && key.includes("]")) {
      const match = key.match(/^(.+)\[(.+)\]$/);
      if (match) {
        const [, field, operator] = match;
        if (!filters[field]) {
          filters[field] = {};
        }
        filters[field][operator] = parseFilterValue(value);
      }
    }
    // Handle operator prefixes (e.g., age_gte=18)
    else if (key.includes("_")) {
      const parts = key.split("_");
      const operator = parts.pop();
      const field = parts.join("_");

      if (
        ["gt", "gte", "lt", "lte", "ne", "in", "nin", "like"].includes(operator)
      ) {
        if (!filters[field]) {
          filters[field] = {};
        }
        filters[field][operator] = parseFilterValue(value);
      } else {
        filters[key] = parseFilterValue(value);
      }
    }
    // Simple equality filter
    else {
      filters[key] = parseFilterValue(value);
    }
  });

  return Object.keys(filters).length > 0 ? filters : null;
}

/**
 * Parse filter value (handle different types)
 */
function parseFilterValue(value) {
  // Handle arrays (e.g., status=active,pending)
  if (typeof value === "string" && value.includes(",")) {
    return value.split(",").map((v) => parseFilterValue(v));
  }

  // Handle booleans
  if (value === "true") return true;
  if (value === "false") return false;

  // Handle numbers
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d+\.\d+$/.test(value)) return parseFloat(value);

  // Handle null
  if (value === "null") return null;

  return value;
}

/**
 * Parse field selection
 */
function parseFieldSelection(fields, exclude) {
  const selection = {};

  if (fields) {
    selection.include = fields.split(",").map((f) => f.trim());
  }

  if (exclude) {
    selection.exclude = exclude.split(",").map((f) => f.trim());
  }

  return Object.keys(selection).length > 0 ? selection : null;
}

/**
 * Parse expansion parameters
 */
function parseExpansionParams(expand, allowedExpands = []) {
  if (!expand) {
    return null;
  }

  const expands = expand.split(",").filter((field) => {
    return allowedExpands.length === 0 || allowedExpands.includes(field);
  });

  return expands.length > 0 ? expands : null;
}

/**
 * Parse date range
 */
function parseDateRange(startDate, endDate, dateField = "createdAt") {
  if (!startDate && !endDate) {
    return null;
  }

  const range = { field: dateField };

  if (startDate) {
    range.start = new Date(startDate);
    if (isNaN(range.start.getTime())) {
      throw new Error(`Invalid start date: ${startDate}`);
    }
  }

  if (endDate) {
    range.end = new Date(endDate);
    if (isNaN(range.end.getTime())) {
      throw new Error(`Invalid end date: ${endDate}`);
    }
  }

  return range;
}

/**
 * Apply search to results (post-query filtering for text search)
 */
export function applySearch(results, searchParams) {
  console.log(`🔍 applySearch called with ${results.length} results`);
  console.log(`🔍 searchParams:`, searchParams);

  if (!searchParams || !searchParams.query) {
    console.log(`🔍 No search params or query, returning all results`);
    return results;
  }

  const { query, fields, type } = searchParams;
  const searchRegex = new RegExp(query, "i");
  console.log(`🔍 Search regex:`, searchRegex);
  console.log(`🔍 Search fields:`, fields);

  const filtered = results.filter((item) => {
    const fieldsToSearch = fields || Object.keys(item);

    const matches = fieldsToSearch.some((field) => {
      const value = getNestedValue(item, field);
      if (value === null || value === undefined) {
        return false;
      }

      const stringValue = String(value);

      switch (type) {
        case "exact":
          return stringValue.toLowerCase() === query.toLowerCase();
        case "starts":
          return stringValue.toLowerCase().startsWith(query.toLowerCase());
        case "ends":
          return stringValue.toLowerCase().endsWith(query.toLowerCase());
        case "contains":
        default:
          const isMatch = searchRegex.test(stringValue);
          if (isMatch) {
            console.log(`🔍 Match found in field "${field}": "${stringValue}"`);
          }
          return isMatch;
      }
    });

    return matches;
  });

  console.log(`🔍 Filtered ${results.length} to ${filtered.length} results`);
  return filtered;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

/**
 * Apply field selection to results
 */
export function applyFieldSelection(results, fieldSelection) {
  if (!fieldSelection) {
    return results;
  }

  return results.map((item) => {
    if (fieldSelection.include) {
      const selected = {};
      fieldSelection.include.forEach((field) => {
        const value = getNestedValue(item, field);
        if (value !== undefined) {
          setNestedValue(selected, field, value);
        }
      });
      // Always include id
      if (item.id && !selected.id) {
        selected.id = item.id;
      }
      return selected;
    }

    if (fieldSelection.exclude) {
      const filtered = { ...item };
      fieldSelection.exclude.forEach((field) => {
        deleteNestedValue(filtered, field);
      });
      return filtered;
    }

    return item;
  });
}

/**
 * Set nested value in object using dot notation
 */
function setNestedValue(obj, path, value) {
  const keys = path.split(".");
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key]) {
      current[key] = {};
    }
    return current[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * Delete nested value from object using dot notation
 */
function deleteNestedValue(obj, path) {
  const keys = path.split(".");
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => current?.[key], obj);
  if (target && lastKey in target) {
    delete target[lastKey];
  }
}

/**
 * Apply sorting to results (in-memory sorting)
 */
export function applySorting(results, sortParams) {
  if (!sortParams) {
    return results;
  }

  const sortArray = Array.isArray(sortParams) ? sortParams : [sortParams];

  return results.sort((a, b) => {
    for (const { field, order } of sortArray) {
      const aVal = getNestedValue(a, field);
      const bVal = getNestedValue(b, field);

      if (aVal === bVal) continue;

      // Handle null/undefined values
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return order === "desc" ? -comparison : comparison;
    }
    return 0;
  });
}

// Simple array helpers used by some services (legacy compatibility)
export function sortArray(items, field, order = "asc") {
  return [...items].sort((a, b) => {
    const va = getNestedValue(a, field);
    const vb = getNestedValue(b, field);
    if (va === vb) return 0;
    const cmp = va < vb ? -1 : 1;
    return order === "desc" ? -cmp : cmp;
  });
}

export function paginateArray(items, page = 1, limit = 20) {
  const start = (page - 1) * limit;
  const data = items.slice(start, start + limit);
  return {
    data,
    pagination: {
      page,
      limit,
      total: items.length,
      pages: Math.ceil(items.length / limit),
    },
  };
}

export function searchInArray(items, query, fields = []) {
  if (!query) return items;
  const re = new RegExp(query, "i");
  return items.filter((it) =>
    (fields.length ? fields : Object.keys(it)).some((f) =>
      re.test(String(getNestedValue(it, f) ?? ""))
    )
  );
}

/**
 * Apply pagination to results (in-memory pagination)
 */
export function applyPagination(results, paginationParams) {
  if (!paginationParams) {
    return { data: results, total: results.length };
  }

  const { offset, limit } = paginationParams;
  const total = results.length;
  const data = results.slice(offset, offset + limit);

  return { data, total };
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(a, b, c) {
  // Backward-compatible: support legacy signature (page, limit, total[, currentCount])
  // and new signature (total, parsedParams)
  if (typeof a === "number" && b && typeof b === "object" && b.pagination) {
    const total = a;
    const { page, limit } = b.pagination;
    const pages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
      nextPage: page < pages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    };
  }

  if (typeof a === "number" && typeof b === "number") {
    const page = a;
    const limit = b;
    const total = typeof c === "number" ? c : 0;
    const pages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
      nextPage: page < pages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    };
  }

  // Fallback: assume new signature but missing pagination
  const total = Number(a) || 0;
  return {
    page: 1,
    limit: total,
    total,
    pages: 1,
    hasNext: false,
    hasPrev: false,
    nextPage: null,
    prevPage: null,
  };
}

/**
 * Format response with pagination
 */
export function formatPaginatedResponse(
  data,
  total,
  parsedParams,
  message = "Data retrieved successfully"
) {
  return {
    data,
    pagination: createPaginationMeta(total, parsedParams),
    message,
    status: "success",
  };
}

/**
 * Process query results with all transformations
 */
export function processQueryResults(results, parsedParams) {
  let processedResults = [...results];

  // Apply search first
  if (parsedParams.search) {
    processedResults = applySearch(processedResults, parsedParams.search);
  }

  // Apply sorting
  if (parsedParams.sort) {
    processedResults = applySorting(processedResults, parsedParams.sort);
  }

  // Get total before pagination
  const total = processedResults.length;

  // Apply pagination
  const { data } = applyPagination(processedResults, parsedParams.pagination);

  // Apply field selection
  const finalData = parsedParams.fields
    ? applyFieldSelection(data, parsedParams.fields)
    : data;

  return {
    data: finalData,
    total,
  };
}

/**
 * Helper to convert to CSV
 */
export function convertToCSV(data) {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(",");

  const csvRows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        return stringValue.includes(",") ? `"${stringValue}"` : stringValue;
      })
      .join(",");
  });

  return [csvHeaders, ...csvRows].join("\n");
}

// Compatibility alias used by some services
export function convertToJSON(data) {
  return JSON.stringify(data, null, 2);
}

/**
 * Build query string from parameters
 */
export function buildQueryString(params) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        value.forEach((v) => query.append(key, v));
      } else if (typeof value === "object") {
        Object.entries(value).forEach(([subKey, subValue]) => {
          query.append(`${key}[${subKey}]`, subValue);
        });
      } else {
        query.append(key, value);
      }
    }
  });

  return query.toString();
}

// ---------------------------------------------------------------------------
// Compatibility helpers for older services
// ---------------------------------------------------------------------------

/**
 * Build a Firestore query with basic sort and equality filters.
 * This is a lightweight helper to support modules still using the old pattern.
 */
export function buildFirestoreQuery(collectionName, options = {}) {
  const { sort = "createdAt", order = "desc", filters = {} } = options;
  let ref = db.collection(collectionName);
  // Apply simple equality filters only (legacy behavior)
  if (filters && typeof filters === "object") {
    Object.entries(filters).forEach(([field, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        typeof value !== "object" // ignore range/operators for now
      ) {
        ref = ref.where(field, "==", value);
      }
    });
  }
  try {
    ref = ref.orderBy(sort, order);
  } catch {}
  return ref;
}

// Aliases expected by some modules
export const generateCSV = convertToCSV;
export function generateJSON(data) {
  return JSON.stringify(data, null, 2);
}

// Basic statistics generator: counts by provided fields
export function generateStats(items, fields = []) {
  const result = {};
  if (!Array.isArray(items) || items.length === 0) return result;
  const keys = Array.isArray(fields) ? fields : [fields];
  const keyName = keys.join("|") || "all";
  result[keyName] = {};
  for (const item of items) {
    const keyVal = keys
      .map((k) => String(getNestedValue(item, k) ?? "unknown"))
      .join("|");
    result[keyName][keyVal] = (result[keyName][keyVal] || 0) + 1;
  }
  return result;
}

/**
 * createExportResponse - standard export response builder used by controllers
 */
export function createExportResponse(payload, format = "json", label = "data") {
  const fmt = String(format).toLowerCase();
  if (fmt === "csv") {
    return {
      content: typeof payload === "string" ? payload : convertToCSV(payload),
      contentType: "text/csv",
      disposition: `attachment; filename="${label}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    };
  }
  const body =
    typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  return {
    content: body,
    contentType: "application/json",
    disposition: `attachment; filename="${label}-${new Date()
      .toISOString()
      .slice(0, 10)}.json"`,
  };
}
