import {
  createExternalPermission,
  getExternalPermissionById,
  updateExternalPermissionById,
  deleteExternalPermissionById,
  getAllExternalPermissions,
} from "./permission.firestore.js";
import { newExternalPermissionId } from "./permission.validation.js";
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
 * Create a new external permission with metadata
 */
export const createExternalPermissionService = async (
  externalPermissionData,
  tenantId,
  actor
) => {
  const permissionId = newExternalPermissionId();

  const externalPermissionWithMetadata = {
    permissionId,
    ...externalPermissionData,
    created: {
      by: actor,
      when: new Date().toISOString(),
    },
    updated: {
      by: actor,
      when: new Date().toISOString(),
    },
  };

  return await createExternalPermission(
    externalPermissionWithMetadata,
    tenantId
  );
};

/**
 * Get external permission by ID
 */
export const getExternalPermissionByIdService = async (
  permissionId,
  tenantId
) => {
  return await getExternalPermissionById(permissionId, tenantId);
};

/**
 * Update external permission by ID with metadata
 */
export const updateExternalPermissionByIdService = async (
  permissionId,
  tenantId,
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

  return await updateExternalPermissionById(
    permissionId,
    tenantId,
    dataWithMetadata
  );
};

/**
 * Delete external permission by ID
 */
export const deleteExternalPermissionByIdService = async (
  permissionId,
  tenantId
) => {
  return await deleteExternalPermissionById(permissionId, tenantId);
};

/**
 * Get all external permissions
 */
export const getAllExternalPermissionsService = async (tenantId) => {
  return await getAllExternalPermissions(tenantId);
};

// ---------------------------------------------------------------------------
// Enhanced query services
// ---------------------------------------------------------------------------

/**
 * List external permissions with search/sort/paginate/filter support
 */
export const listExternalPermissionsService = async (tenantId, query = {}) => {
  // Allowed fields (lightweight constraints)
  const parsed = parseQueryParams(query, {
    maxLimit: 1000, // allow requesting up to 1000 permission documents in one page
    allowedSortFields: ["module", "created.when", "updated.when"],
    allowedSearchFields: ["module", "permissions"],
    // No explicit filter allow-list for now
  });

  const all = await getAllExternalPermissions(tenantId);

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
 * Search external permissions (alias of list with emphasis on search)
 */
export const searchExternalPermissionsService = async (
  tenantId,
  query = {}
) => {
  return listExternalPermissionsService(tenantId, query);
};

/**
 * Bulk operations for external permissions
 * operation: "create" | "update" | "delete"
 */
export const bulkExternalPermissionsService = async (
  operation,
  tenantId,
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
        const permissionId = newExternalPermissionId();
        const payload = {
          permissionId,
          ...item,
          created: { by: actor, when: new Date().toISOString() },
          updated: { by: actor, when: new Date().toISOString() },
        };
        const created = await createExternalPermission(payload, tenantId);
        results.push({ success: true, action: "create", data: created });
      } else if (operation === "update") {
        const { permissionId, ...rest } = item;
        if (!permissionId)
          throw new Error("permissionId is required for update");
        const updated = await updateExternalPermissionById(
          permissionId,
          tenantId,
          {
            ...rest,
            updated: { by: actor, when: new Date().toISOString() },
          }
        );
        results.push({ success: true, action: "update", data: updated });
      } else if (operation === "delete") {
        const { permissionId } = item;
        if (!permissionId)
          throw new Error("permissionId is required for delete");
        const deleted = await deleteExternalPermissionById(
          permissionId,
          tenantId
        );
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
  return { success, results };
};

/**
 * Export external permissions to CSV or JSON
 */
export const exportExternalPermissionsService = async (
  tenantId,
  format = "json",
  query = {}
) => {
  const { data } = await listExternalPermissionsService(tenantId, query);
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

  const filename = `external-permissions.${extension}`;
  return { data: payload, mimeType, filename };
};

/**
 * Generate statistics for external permissions
 */
export const getExternalPermissionsStatsService = async (tenantId) => {
  const all = await getAllExternalPermissions(tenantId);
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
