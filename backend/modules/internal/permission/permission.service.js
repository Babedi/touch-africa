import {
  createInternalPermission,
  getInternalPermissionById,
  updateInternalPermissionById,
  deleteInternalPermissionById,
  getAllInternalPermissions,
} from "./permission.firestore.js";
import { newInternalPermissionId } from "./permission.validation.js";
import {
  parseQueryParams,
  applySearch,
  applySorting,
  applyPagination,
  generateCSV,
  generateJSON,
  generateStats,
} from "../../../utilities/query.util.js";

/**
 * Create a new internal permission with metadata
 */
export const createInternalPermissionService = async (
  internalPermissionData,
  actor
) => {
  const permissionId = newInternalPermissionId();

  const internalPermissionWithMetadata = {
    permissionId,
    ...internalPermissionData,
    created: {
      by: actor,
      when: new Date().toISOString(),
    },
    updated: {
      by: actor,
      when: new Date().toISOString(),
    },
  };

  return await createInternalPermission(internalPermissionWithMetadata);
};

/**
 * Get internal permission by ID
 */
export const getInternalPermissionByIdService = async (permissionId) => {
  return await getInternalPermissionById(permissionId);
};

/**
 * Update internal permission by ID with metadata
 */
export const updateInternalPermissionByIdService = async (
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

  return await updateInternalPermissionById(permissionId, dataWithMetadata);
};

/**
 * Delete internal permission by ID
 */
export const deleteInternalPermissionByIdService = async (permissionId) => {
  return await deleteInternalPermissionById(permissionId);
};

/**
 * Get all internal permissions
 */
export const getAllInternalPermissionsService = async () => {
  return await getAllInternalPermissions();
};

// ---------------------------------------------------------------------------
// Enhanced query services
// ---------------------------------------------------------------------------

/**
 * List internal permissions with search/sort/paginate/filter support
 */
export const listInternalPermissionsService = async (query = {}) => {
  // Allowed fields (lightweight constraints)
  const parsed = parseQueryParams(query, {
    maxLimit: 1000, // allow requesting up to 1000 permission documents in one page
    allowedSortFields: ["module", "created.when", "updated.when"],
    allowedSearchFields: ["module", "permissions"],
    // No explicit filter allow-list for now
  });

  const all = await getAllInternalPermissions();

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
 * Search internal permissions (alias of list with emphasis on search)
 */
export const searchInternalPermissionsService = async (query = {}) => {
  return listInternalPermissionsService(query);
};

/**
 * Bulk operations for internal permissions
 * operation: "create" | "update" | "delete"
 */
export const bulkInternalPermissionsService = async (
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
        const permissionId = newInternalPermissionId();
        const payload = {
          permissionId,
          ...item,
          created: { by: actor, when: new Date().toISOString() },
          updated: { by: actor, when: new Date().toISOString() },
        };
        const created = await createInternalPermission(payload);
        results.push({ success: true, action: "create", data: created });
      } else if (operation === "update") {
        const { permissionId, ...rest } = item;
        if (!permissionId)
          throw new Error("permissionId is required for update");
        const updated = await updateInternalPermissionById(permissionId, {
          ...rest,
          updated: { by: actor, when: new Date().toISOString() },
        });
        results.push({ success: true, action: "update", data: updated });
      } else if (operation === "delete") {
        const { permissionId } = item;
        if (!permissionId)
          throw new Error("permissionId is required for delete");
        const deleted = await deleteInternalPermissionById(permissionId);
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
 * Export internal permissions to CSV or JSON
 */
export const exportInternalPermissionsService = async (
  format = "json",
  query = {}
) => {
  const { data } = await listInternalPermissionsService(query);
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

  const filename = `internal-permissions.${extension}`;
  return { data: payload, mimeType, filename };
};

/**
 * Generate statistics for internal permissions
 */
export const getInternalPermissionsStatsService = async () => {
  const all = await getAllInternalPermissions();
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
