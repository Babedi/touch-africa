import {
  createStandardPermission,
  getStandardPermissionById,
  updateStandardPermissionById,
  deleteStandardPermissionById,
  getAllStandardPermissions,
} from "./standard.permission.firestore.js";
import { newStandardPermissionId } from "./standard.permission.validation.js";
import {
  parseQueryParams,
  applySearch,
  applySorting,
  applyPagination,
  generateCSV,
  generateJSON,
  generateStats,
} from "../../../../utilities/query.util.js";

/**
 * Create a new standard permission with metadata
 */
export const createStandardPermissionService = async (
  standardPermissionData,
  actor
) => {
  const permissionId = newStandardPermissionId();

  const standardPermissionWithMetadata = {
    permissionId,
    ...standardPermissionData,
    created: {
      by: actor,
      when: new Date().toISOString(),
    },
    updated: {
      by: actor,
      when: new Date().toISOString(),
    },
  };

  return await createStandardPermission(standardPermissionWithMetadata);
};

/**
 * Get standard permission by ID
 */
export const getStandardPermissionByIdService = async (permissionId) => {
  return await getStandardPermissionById(permissionId);
};

/**
 * Update standard permission by ID with metadata
 */
export const updateStandardPermissionByIdService = async (
  permissionId,
  updateData,
  actor
) => {
  const dataWithMetadata = {
    ...updateData,
    updated: {
      by: actor,
      when: new Date().toISOString(),
    },
  };

  return await updateStandardPermissionById(permissionId, dataWithMetadata);
};

/**
 * Delete standard permission by ID
 */
export const deleteStandardPermissionByIdService = async (permissionId) => {
  return await deleteStandardPermissionById(permissionId);
};

/**
 * Get all standard permissions
 */
export const getAllStandardPermissionsService = async () => {
  return await getAllStandardPermissions();
};

// ---------------------------------------------------------------------------
// Enhanced query services
// ---------------------------------------------------------------------------

/**
 * List standard permissions with search/sort/paginate/filter support
 */
export const listStandardPermissionsService = async (query = {}) => {
  // Allowed fields (lightweight constraints)
  const parsed = parseQueryParams(query, {
    maxLimit: 1000, // allow requesting up to 1000 permission documents in one page
    allowedSortFields: ["module", "created.when", "updated.when"],
    allowedSearchFields: ["module", "permissions"],
    // No explicit filter allow-list for now
  });

  // Get all standard permissions
  const all = await getAllStandardPermissions();

  // Allow computed searchable text for permissions array
  const normalized = all.map((p) => ({
    ...p,
    permissionsText: Array.isArray(p.permissions)
      ? p.permissions.join(", ")
      : String(p.permissions || ""),
  }));

  let results = normalized;
  const searchParams = parsed.search
    ? {
        ...parsed.search,
        fields: parsed.search.fields || ["module", "permissionsText"],
      }
    : null;

  if (searchParams) results = applySearch(results, searchParams);
  results = applySorting(results, parsed.sort);
  const { data, pagination } = applyPagination(results, parsed.pagination);

  return { data, pagination };
};

/**
 * Search standard permissions (alias of list with emphasis on search)
 */
export const searchStandardPermissionsService = async (query = {}) => {
  return listStandardPermissionsService(query);
};

/**
 * Bulk operations for standard permissions
 * operation: "create" | "update" | "delete"
 */
export const bulkStandardPermissionsService = async (
  operation,
  data = [],
  actor = "system"
) => {
  if (!Array.isArray(data)) {
    throw new Error("Bulk data must be an array");
  }

  const results = [];
  for (const item of data) {
    try {
      if (operation === "create") {
        const permissionId = newStandardPermissionId();
        const payload = {
          permissionId,
          ...item,
          created: { by: actor, when: new Date().toISOString() },
          updated: { by: actor, when: new Date().toISOString() },
        };
        const created = await createStandardPermission(payload);
        results.push({ success: true, action: "create", data: created });
      } else if (operation === "update") {
        const { permissionId, ...rest } = item;
        if (!permissionId)
          throw new Error("permissionId is required for update");
        const updated = await updateStandardPermissionById(permissionId, {
          ...rest,
          updated: { by: actor, when: new Date().toISOString() },
        });
        results.push({ success: true, action: "update", data: updated });
      } else if (operation === "delete") {
        const { permissionId } = item;
        if (!permissionId)
          throw new Error("permissionId is required for delete");
        const deleted = await deleteStandardPermissionById(permissionId);
        results.push({
          success: deleted,
          action: "delete",
          data: { permissionId },
        });
      } else {
        throw new Error(`Unsupported bulk operation: ${operation}`);
      }
    } catch (err) {
      results.push({ success: false, error: err.message, item });
    }
  }

  const success = results.every((r) => r.success);
  return { success, results };
};

/**
 * Export standard permissions to CSV or JSON
 */
export const exportStandardPermissionsService = async (
  format = "json",
  query = {}
) => {
  const { data } = await listStandardPermissionsService(query);
  let payload;
  let mimeType;
  let extension;

  if (String(format).toLowerCase() === "csv") {
    payload = generateCSV(data, [
      "permissionId",
      "module",
      "permissions",
      "created.when",
      "created.by",
      "updated.when",
      "updated.by",
    ]);
    mimeType = "text/csv";
    extension = "csv";
  } else {
    payload = generateJSON(data);
    mimeType = "application/json";
    extension = "json";
  }

  const filename = `standard-permissions.${extension}`;
  return { data: payload, mimeType, filename };
};

/**
 * Generate statistics for standard permissions
 */
export const getStandardPermissionsStatsService = async () => {
  const all = await getAllStandardPermissions();
  const stats = {};

  // Count by module
  const byModule = generateStats(all, ["module"]);

  // Total entries and total permission strings across modules
  const totalRecords = all.length;
  const totalPermissions = all.reduce(
    (sum, p) => sum + (Array.isArray(p.permissions) ? p.permissions.length : 0),
    0
  );

  stats.summary = {
    totalRecords,
    totalPermissions,
    avgPermissionsPerModule:
      totalRecords > 0
        ? Number((totalPermissions / totalRecords).toFixed(2))
        : 0,
  };
  stats.byModule = byModule;

  return stats;
};
