import {
  createRoleMapping,
  getRoleMappingById,
  updateRoleMappingById,
  deleteRoleMappingById,
  getAllRoleMappings,
  getRoleMappingByName,
} from "./role.mapping.firestore.js";
import { newRoleMappingId } from "./role.mapping.validation.js";
import roleMappingConfig from "../../../config/role-mappings.config.js";
import {
  paginateArray,
  sortArray,
  searchInArray,
  generateCSV,
  generateJSON,
  generateStats,
} from "../../../utilities/query.util.js";

/**
 * Create a new role mapping with metadata
 */
export const createRoleMappingService = async (
  roleMappingData,
  actor,
  tenantId
) => {
  const mappingId = newRoleMappingId();

  const roleMappingWithMetadata = {
    mappingId,
    ...roleMappingData,
    created: {
      by: actor,
      when: new Date().toISOString(),
    },
    updated: {
      by: actor,
      when: new Date().toISOString(),
    },
  };

  // Also update the in-memory config
  roleMappingConfig.addMapping(
    roleMappingData.roleName,
    roleMappingData.roleCode
  );
  await roleMappingConfig.saveToFile();

  return await createRoleMapping(roleMappingWithMetadata, tenantId);
};

/**
 * Get role mapping by ID
 */
export const getRoleMappingByIdService = async (mappingId, tenantId) => {
  return await getRoleMappingById(mappingId, tenantId);
};

/**
 * Get role mapping by name
 */
export const getRoleMappingByNameService = async (roleName, tenantId) => {
  return await getRoleMappingByName(roleName, tenantId);
};

/**
 * Update role mapping by ID with metadata
 */
export const updateRoleMappingByIdService = async (
  mappingId,
  updateData,
  actor,
  tenantId
) => {
  const dataWithMetadata = {
    ...updateData,
    updated: {
      by: actor,
      when: new Date().toISOString(),
    },
  };

  const result = await updateRoleMappingById(
    mappingId,
    dataWithMetadata,
    tenantId
  );

  // Update in-memory config if roleCode was changed
  if (updateData.roleCode) {
    const mapping = await getRoleMappingById(mappingId, tenantId);
    if (mapping) {
      roleMappingConfig.addMapping(mapping.roleName, updateData.roleCode);
      await roleMappingConfig.saveToFile();
    }
  }

  return result;
};

/**
 * Delete role mapping by ID
 */
export const deleteRoleMappingByIdService = async (mappingId, tenantId) => {
  // Get the mapping first to update config
  const mapping = await getRoleMappingById(mappingId, tenantId);

  const result = await deleteRoleMappingById(mappingId, tenantId);

  // Remove from in-memory config
  if (mapping && result) {
    roleMappingConfig.removeMapping(mapping.roleName);
    await roleMappingConfig.saveToFile();
  }

  return result;
};

/**
 * Get all role mappings with current status
 */
export const getAllRoleMappingsService = async (tenantId) => {
  const dbMappings = await getAllRoleMappings(tenantId);
  const configMappings = roleMappingConfig.getAllMappings();
  const status = roleMappingConfig.getStatus();

  return {
    mappings: dbMappings,
    configMappings,
    status,
    count: dbMappings.length,
  };
};

/**
 * Reload role mappings from configuration source
 */
export const reloadRoleMappingsService = async () => {
  await roleMappingConfig.reload();

  return {
    mappings: roleMappingConfig.getAllMappings(),
    status: roleMappingConfig.getStatus(),
    message: "Role mappings reloaded from configuration source",
  };
};

/**
 * Sync database with configuration
 */
export const syncRoleMappingsService = async (actor, tenantId) => {
  const configMappings = roleMappingConfig.getAllMappings();
  const dbMappings = await getAllRoleMappings(tenantId);

  // Convert config mappings to database format
  const syncPromises = Object.entries(configMappings).map(
    ([roleName, roleCode]) => {
      const existingMapping = dbMappings.find((m) => m.roleName === roleName);

      if (existingMapping) {
        // Update existing mapping if roleCode changed
        if (existingMapping.roleCode !== roleCode) {
          return updateRoleMappingByIdService(
            existingMapping.mappingId,
            { roleCode },
            actor,
            tenantId
          );
        }
      } else {
        // Create new mapping
        return createRoleMappingService(
          { roleName, roleCode },
          actor,
          tenantId
        );
      }

      return Promise.resolve(existingMapping);
    }
  );

  await Promise.all(syncPromises);

  return await getAllRoleMappingsService(tenantId);
};

/**
 * Get role code by role name
 */
export const getRoleCodeByNameService = async (roleName, tenantId) => {
  const mapping = await getRoleMappingByName(roleName, tenantId);
  return mapping ? mapping.roleCode : null;
};

/**
 * Check if role mapping exists
 */
export const roleMappingExistsService = async (roleName, tenantId) => {
  const mapping = await getRoleMappingByName(roleName, tenantId);
  return !!mapping;
};

/**
 * Bulk create role mappings
 */
export const bulkCreateRoleMappingsService = async (
  mappingsData,
  actor,
  tenantId,
  overwrite = false
) => {
  const results = [];

  for (const mappingData of mappingsData) {
    try {
      const existing = await getRoleMappingByName(
        mappingData.roleName,
        tenantId
      );

      if (existing && !overwrite) {
        results.push({
          roleName: mappingData.roleName,
          status: "skipped",
          message: "Role mapping already exists",
        });
        continue;
      }

      if (existing && overwrite) {
        const updated = await updateRoleMappingByIdService(
          existing.mappingId,
          mappingData,
          actor,
          tenantId
        );
        results.push({
          roleName: mappingData.roleName,
          status: "updated",
          data: updated,
        });
      } else {
        const created = await createRoleMappingService(
          mappingData,
          actor,
          tenantId
        );
        results.push({
          roleName: mappingData.roleName,
          status: "created",
          data: created,
        });
      }
    } catch (error) {
      results.push({
        roleName: mappingData.roleName,
        status: "error",
        message: error.message,
      });
    }
  }

  return results;
};

/**
 * List role mappings with comprehensive query support
 * @param {Object} queryParams - Query parameters for filtering, sorting, pagination
 * @returns {Object} Paginated and filtered role mappings list
 */
export async function listRoleMappingsService(queryParams = {}, tenantId) {
  try {
    // Get all role mappings from Firestore
    const roleMappings = await getAllRoleMappings(tenantId);

    // Apply search if search term provided
    let filteredData = roleMappings;
    if (queryParams.search) {
      const searchFields = [
        "roleName",
        "roleCode",
        "description",
        "permissions",
      ];
      filteredData = searchInArray(
        filteredData,
        queryParams.search,
        searchFields
      );
    }

    // Apply additional filters
    if (queryParams.roleCode) {
      filteredData = filteredData.filter(
        (mapping) =>
          mapping.roleCode &&
          mapping.roleCode
            .toLowerCase()
            .includes(queryParams.roleCode.toLowerCase())
      );
    }

    if (queryParams.roleName) {
      filteredData = filteredData.filter(
        (mapping) =>
          mapping.roleName &&
          mapping.roleName
            .toLowerCase()
            .includes(queryParams.roleName.toLowerCase())
      );
    }

    if (queryParams.status) {
      filteredData = filteredData.filter(
        (mapping) => mapping.status === queryParams.status
      );
    }

    // Apply sorting
    const sortField = queryParams.sortBy || "roleName";
    const sortDirection = queryParams.sortDirection || "asc";
    const sortedData = sortArray(filteredData, sortField, sortDirection);

    // Apply pagination
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    const result = paginateArray(sortedData, page, limit);

    return {
      data: result.data,
      pagination: result.pagination,
    };
  } catch (error) {
    console.error("Error in listRoleMappingsService:", error);
    throw new Error("Failed to list role mappings: " + error.message);
  }
}

/**
 * Search role mappings with enhanced query capabilities
 * @param {Object} queryParams - Search and filter parameters
 * @returns {Object} Search results with pagination
 */
export async function searchRoleMappingsService(queryParams = {}, tenantId) {
  try {
    // Get all role mappings
    const roleMappings = await getAllRoleMappings(tenantId);

    let searchResults = roleMappings;

    // Enhanced search across multiple fields
    if (queryParams.q || queryParams.search) {
      const searchTerm = queryParams.q || queryParams.search;
      const searchFields = [
        "roleName",
        "roleCode",
        "description",
        "permissions",
        "created.by",
        "updated.by",
        "mappingId",
      ];
      searchResults = searchInArray(searchResults, searchTerm, searchFields);
    }

    // Advanced filtering options
    if (queryParams.roleCodeFilter) {
      searchResults = searchResults.filter(
        (mapping) => mapping.roleCode === queryParams.roleCodeFilter
      );
    }

    if (queryParams.roleNameFilter) {
      searchResults = searchResults.filter(
        (mapping) => mapping.roleName === queryParams.roleNameFilter
      );
    }

    if (queryParams.statusFilter) {
      searchResults = searchResults.filter(
        (mapping) => mapping.status === queryParams.statusFilter
      );
    }

    if (queryParams.permissionFilter) {
      searchResults = searchResults.filter(
        (mapping) =>
          mapping.permissions &&
          mapping.permissions.includes(queryParams.permissionFilter)
      );
    }

    // Date range filtering
    if (queryParams.createdAfter) {
      const afterDate = new Date(queryParams.createdAfter);
      searchResults = searchResults.filter(
        (mapping) =>
          mapping.created &&
          mapping.created.when &&
          new Date(mapping.created.when) > afterDate
      );
    }

    if (queryParams.createdBefore) {
      const beforeDate = new Date(queryParams.createdBefore);
      searchResults = searchResults.filter(
        (mapping) =>
          mapping.created &&
          mapping.created.when &&
          new Date(mapping.created.when) < beforeDate
      );
    }

    // Sorting
    const sortField = queryParams.sortBy || "roleName";
    const sortDirection = queryParams.sortDirection || "asc";
    const sortedResults = sortArray(searchResults, sortField, sortDirection);

    // Pagination
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    const result = paginateArray(sortedResults, page, limit);

    return {
      data: result.data,
      pagination: result.pagination,
      searchTerm: queryParams.q || queryParams.search,
      filtersApplied: {
        roleCode: queryParams.roleCodeFilter,
        roleName: queryParams.roleNameFilter,
        status: queryParams.statusFilter,
        permission: queryParams.permissionFilter,
        dateRange: {
          after: queryParams.createdAfter,
          before: queryParams.createdBefore,
        },
      },
    };
  } catch (error) {
    console.error("Error in searchRoleMappingsService:", error);
    throw new Error("Failed to search role mappings: " + error.message);
  }
}

/**
 * Bulk operations for role mappings
 * @param {string} operation - Type of bulk operation (create, update, delete, validate)
 * @param {Array} data - Array of role mapping data for processing
 * @returns {Object} Results of bulk operation
 */
export async function bulkRoleMappingsService(operation, data = []) {
  try {
    const results = {
      operation,
      timestamp: new Date().toISOString(),
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [],
      data: [],
    };

    switch (operation.toLowerCase()) {
      case "create":
        for (const [index, mappingData] of data.entries()) {
          try {
            const created = await createRoleMappingService(
              mappingData,
              "bulk_operation"
            );
            results.successful++;
            results.data.push({
              index,
              id: created.mappingId,
              status: "created",
              data: created,
            });
          } catch (error) {
            results.failed++;
            results.errors.push({
              index,
              error: error.message,
              data: mappingData,
            });
          }
          results.processed++;
        }
        break;

      case "update":
        for (const [index, mappingData] of data.entries()) {
          try {
            if (!mappingData.mappingId) {
              throw new Error("Mapping ID is required for update operation");
            }
            const updated = await updateRoleMappingByIdService(
              mappingData.mappingId,
              mappingData,
              "bulk_operation"
            );
            results.successful++;
            results.data.push({
              index,
              id: mappingData.mappingId,
              status: "updated",
              data: updated,
            });
          } catch (error) {
            results.failed++;
            results.errors.push({
              index,
              error: error.message,
              data: mappingData,
            });
          }
          results.processed++;
        }
        break;

      case "delete":
        for (const [index, item] of data.entries()) {
          try {
            const mappingId = typeof item === "string" ? item : item.mappingId;
            if (!mappingId) {
              throw new Error("Mapping ID is required for delete operation");
            }
            await deleteRoleMappingByIdService(mappingId, "bulk_operation");
            results.successful++;
            results.data.push({
              index,
              id: mappingId,
              status: "deleted",
            });
          } catch (error) {
            results.failed++;
            results.errors.push({
              index,
              error: error.message,
              data: item,
            });
          }
          results.processed++;
        }
        break;

      case "validate":
        for (const [index, mappingData] of data.entries()) {
          try {
            const validation = validateRoleMappingData(mappingData);
            if (validation.isValid) {
              results.successful++;
              results.data.push({
                index,
                status: "valid",
                data: mappingData,
              });
            } else {
              results.failed++;
              results.errors.push({
                index,
                error: validation.errors.join(", "),
                data: mappingData,
              });
            }
            results.processed++;
          } catch (error) {
            results.failed++;
            results.errors.push({
              index,
              error: error.message,
              data: mappingData,
            });
          }
        }
        break;

      default:
        throw new Error(`Unsupported bulk operation: ${operation}`);
    }

    results.success = results.failed === 0;
    return results;
  } catch (error) {
    console.error("Error in bulkRoleMappingsService:", error);
    throw new Error("Bulk operation failed: " + error.message);
  }
}

/**
 * Export role mappings in various formats
 * @param {string} format - Export format (json, csv)
 * @param {Object} queryParams - Query parameters for filtering data to export
 * @returns {Object} Export data with appropriate formatting
 */
export async function exportRoleMappingsService(
  format = "json",
  queryParams = {}
) {
  try {
    // Get filtered data using the list service
    const { data } = await listRoleMappingsService(queryParams);

    let exportData;
    let mimeType;
    let filename;

    switch (format.toLowerCase()) {
      case "csv":
        const csvFields = [
          "mappingId",
          "roleName",
          "roleCode",
          "description",
          "status",
          "permissions",
          "created.by",
          "created.when",
          "updated.by",
          "updated.when",
        ];
        exportData = generateCSV(data, csvFields);
        mimeType = "text/csv";
        filename = `role_mappings_export_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        break;

      case "json":
      default:
        exportData = generateJSON(data);
        mimeType = "application/json";
        filename = `role_mappings_export_${
          new Date().toISOString().split("T")[0]
        }.json`;
        break;
    }

    return {
      data: exportData,
      mimeType,
      filename,
      recordCount: data.length,
      exportDate: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error in exportRoleMappingsService:", error);
    throw new Error("Export failed: " + error.message);
  }
}

/**
 * Get role mappings statistics and analytics
 * @returns {Object} Comprehensive statistics about role mappings
 */
export async function getRoleMappingsStatsService(tenantId) {
  try {
    const roleMappings = await getAllRoleMappings(tenantId);

    // Generate basic statistics
    const basicStats = generateStats(roleMappings, ["status", "roleCode"]);

    // Custom role mappings analytics
    const analytics = {
      overview: {
        totalMappings: roleMappings.length,
        uniqueRoles: [
          ...new Set(
            roleMappings.map((mapping) => mapping.roleName).filter(Boolean)
          ),
        ],
        uniqueCodes: [
          ...new Set(
            roleMappings.map((mapping) => mapping.roleCode).filter(Boolean)
          ),
        ],
        statuses: [
          ...new Set(
            roleMappings.map((mapping) => mapping.status).filter(Boolean)
          ),
        ],
      },
      distributions: {
        byStatus: basicStats.status || {},
        byRoleCode: basicStats.roleCode || {},
      },
      insights: {
        mostCommonStatus: getMostCommon(roleMappings, "status"),
        mappingsWithoutDescription: roleMappings.filter(
          (mapping) => !mapping.description
        ).length,
        mappingsWithPermissions: roleMappings.filter(
          (mapping) => mapping.permissions && mapping.permissions.length > 0
        ).length,
        averagePermissionsPerRole: calculateAveragePermissions(roleMappings),
        recentlyCreated: getRecentlyCreated(roleMappings),
        recentlyUpdated: getRecentlyUpdated(roleMappings),
      },
    };

    return {
      ...basicStats,
      ...analytics,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error in getRoleMappingsStatsService:", error);
    throw new Error("Failed to generate statistics: " + error.message);
  }
}

// Helper functions
function validateRoleMappingData(data) {
  const errors = [];

  if (!data.roleName) errors.push("Role name is required");
  if (!data.roleCode) errors.push("Role code is required");
  if (data.permissions && !Array.isArray(data.permissions))
    errors.push("Permissions must be an array");

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function getMostCommon(data, field) {
  const counts = data.reduce((acc, item) => {
    const value = item[field];
    if (value) {
      acc[value] = (acc[value] || 0) + 1;
    }
    return acc;
  }, {});

  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] || null;
}

function calculateAveragePermissions(data) {
  const mappingsWithPermissions = data.filter(
    (mapping) => mapping.permissions && Array.isArray(mapping.permissions)
  );

  if (mappingsWithPermissions.length === 0) return 0;

  const totalPermissions = mappingsWithPermissions.reduce(
    (sum, mapping) => sum + mapping.permissions.length,
    0
  );

  return (totalPermissions / mappingsWithPermissions.length).toFixed(2);
}

function getRecentlyCreated(data, days = 7) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return data.filter(
    (item) =>
      item.created && item.created.when && new Date(item.created.when) > cutoff
  ).length;
}

function getRecentlyUpdated(data, days = 7) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return data.filter(
    (item) =>
      item.updated && item.updated.when && new Date(item.updated.when) > cutoff
  ).length;
}
