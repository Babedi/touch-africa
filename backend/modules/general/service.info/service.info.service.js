import { getServiceInfo, updateServiceInfo } from "./service.info.firestore.js";
import {
  paginateArray,
  sortArray,
  searchInArray,
  generateCSV,
  generateJSON,
  generateStats,
} from "../../../utilities/query.util.js";

export async function serviceGetServiceInfo() {
  return await getServiceInfo();
}

export async function serviceUpdateServiceInfo(payload, actor) {
  const model = {
    ...payload,
    updated: { by: actor || "system", when: new Date().toISOString() },
  };
  return await updateServiceInfo(model);
}

/**
 * List service info with comprehensive query support
 * @param {Object} queryParams - Query parameters for filtering, sorting, pagination
 * @returns {Object} Paginated and filtered service info list
 */
export async function listServiceInfoService(queryParams = {}) {
  try {
    // Get all service info from Firestore
    const serviceInfoData = await getServiceInfo();

    // Convert to array format for processing
    const serviceInfoArray = Array.isArray(serviceInfoData)
      ? serviceInfoData
      : [serviceInfoData];

    // Apply search if search term provided
    let filteredData = serviceInfoArray;
    if (queryParams.search) {
      const searchFields = [
        "title",
        "description",
        "category",
        "version",
        "status",
      ];
      filteredData = searchInArray(
        filteredData,
        queryParams.search,
        searchFields
      );
    }

    // Apply additional filters
    if (queryParams.status) {
      filteredData = filteredData.filter(
        (item) =>
          item.status &&
          item.status.toLowerCase().includes(queryParams.status.toLowerCase())
      );
    }

    if (queryParams.category) {
      filteredData = filteredData.filter(
        (item) =>
          item.category &&
          item.category
            .toLowerCase()
            .includes(queryParams.category.toLowerCase())
      );
    }

    if (queryParams.version) {
      filteredData = filteredData.filter(
        (item) => item.version && item.version.includes(queryParams.version)
      );
    }

    // Apply sorting
    const sortField = queryParams.sortBy || "updated.when";
    const sortDirection = queryParams.sortDirection || "desc";
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
    console.error("Error in listServiceInfoService:", error);
    throw new Error("Failed to list service info: " + error.message);
  }
}

/**
 * Search service info with enhanced query capabilities
 * @param {Object} queryParams - Search and filter parameters
 * @returns {Object} Search results with pagination
 */
export async function searchServiceInfoService(queryParams = {}) {
  try {
    // Get all service info data
    const serviceInfoData = await getServiceInfo();
    const serviceInfoArray = Array.isArray(serviceInfoData)
      ? serviceInfoData
      : [serviceInfoData];

    let searchResults = serviceInfoArray;

    // Enhanced search across multiple fields
    if (queryParams.q || queryParams.search) {
      const searchTerm = queryParams.q || queryParams.search;
      const searchFields = [
        "title",
        "description",
        "category",
        "version",
        "status",
        "features",
        "requirements",
        "documentation",
      ];
      searchResults = searchInArray(searchResults, searchTerm, searchFields);
    }

    // Advanced filtering options
    if (queryParams.statusFilter) {
      searchResults = searchResults.filter(
        (item) => item.status === queryParams.statusFilter
      );
    }

    if (queryParams.categoryFilter) {
      searchResults = searchResults.filter(
        (item) => item.category === queryParams.categoryFilter
      );
    }

    if (queryParams.versionFilter) {
      searchResults = searchResults.filter(
        (item) => item.version === queryParams.versionFilter
      );
    }

    // Date range filtering
    if (queryParams.updatedAfter) {
      const afterDate = new Date(queryParams.updatedAfter);
      searchResults = searchResults.filter(
        (item) =>
          item.updated &&
          item.updated.when &&
          new Date(item.updated.when) > afterDate
      );
    }

    if (queryParams.updatedBefore) {
      const beforeDate = new Date(queryParams.updatedBefore);
      searchResults = searchResults.filter(
        (item) =>
          item.updated &&
          item.updated.when &&
          new Date(item.updated.when) < beforeDate
      );
    }

    // Sorting
    const sortField = queryParams.sortBy || "updated.when";
    const sortDirection = queryParams.sortDirection || "desc";
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
        status: queryParams.statusFilter,
        category: queryParams.categoryFilter,
        version: queryParams.versionFilter,
        dateRange: {
          after: queryParams.updatedAfter,
          before: queryParams.updatedBefore,
        },
      },
    };
  } catch (error) {
    console.error("Error in searchServiceInfoService:", error);
    throw new Error("Failed to search service info: " + error.message);
  }
}

/**
 * Bulk operations for service info records
 * @param {string} operation - Type of bulk operation (export, analyze, validate)
 * @param {Array} data - Array of service info data for processing
 * @returns {Object} Results of bulk operation
 */
export async function bulkServiceInfoService(operation, data = []) {
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
      case "validate":
        for (const [index, item] of data.entries()) {
          try {
            // Validate service info structure
            const validation = validateServiceInfoStructure(item);
            if (validation.isValid) {
              results.successful++;
              results.data.push({
                index,
                status: "valid",
                item: item,
              });
            } else {
              results.failed++;
              results.errors.push({
                index,
                error: validation.errors.join(", "),
              });
            }
            results.processed++;
          } catch (error) {
            results.failed++;
            results.errors.push({
              index,
              error: error.message,
            });
          }
        }
        break;

      case "analyze":
        // Analyze service info for insights
        const serviceInfoData = await getServiceInfo();
        const analysisData = Array.isArray(serviceInfoData)
          ? serviceInfoData
          : [serviceInfoData];

        results.data = {
          totalRecords: analysisData.length,
          statusDistribution: analyzeStatusDistribution(analysisData),
          categoryDistribution: analyzeCategoryDistribution(analysisData),
          versionAnalysis: analyzeVersions(analysisData),
          updateHistory: analyzeUpdateHistory(analysisData),
        };
        results.successful = 1;
        results.processed = 1;
        break;

      case "backup":
        // Create backup of service info
        const backupData = await getServiceInfo();
        results.data = {
          backup: backupData,
          timestamp: new Date().toISOString(),
          recordCount: Array.isArray(backupData) ? backupData.length : 1,
        };
        results.successful = 1;
        results.processed = 1;
        break;

      default:
        throw new Error(`Unsupported bulk operation: ${operation}`);
    }

    results.success = results.failed === 0;
    return results;
  } catch (error) {
    console.error("Error in bulkServiceInfoService:", error);
    throw new Error("Bulk operation failed: " + error.message);
  }
}

/**
 * Export service info data in various formats
 * @param {string} format - Export format (json, csv)
 * @param {Object} queryParams - Query parameters for filtering data to export
 * @returns {Object} Export data with appropriate formatting
 */
export async function exportServiceInfoService(
  format = "json",
  queryParams = {}
) {
  try {
    // Get filtered data using the list service
    const { data } = await listServiceInfoService(queryParams);

    let exportData;
    let mimeType;
    let filename;

    switch (format.toLowerCase()) {
      case "csv":
        const csvFields = [
          "title",
          "description",
          "category",
          "version",
          "status",
          "updated.by",
          "updated.when",
        ];
        exportData = generateCSV(data, csvFields);
        mimeType = "text/csv";
        filename = `service_info_export_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        break;

      case "json":
      default:
        exportData = generateJSON(data);
        mimeType = "application/json";
        filename = `service_info_export_${
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
    console.error("Error in exportServiceInfoService:", error);
    throw new Error("Export failed: " + error.message);
  }
}

/**
 * Get service info statistics and analytics
 * @returns {Object} Comprehensive statistics about service info
 */
export async function getServiceInfoStatsService() {
  try {
    const serviceInfoData = await getServiceInfo();
    const serviceInfoArray = Array.isArray(serviceInfoData)
      ? serviceInfoData
      : [serviceInfoData];

    // Generate basic statistics
    const basicStats = generateStats(serviceInfoArray, [
      "status",
      "category",
      "version",
    ]);

    // Custom service info analytics
    const analytics = {
      overview: {
        totalRecords: serviceInfoArray.length,
        lastUpdated: getLastUpdatedDate(serviceInfoArray),
        categories: [
          ...new Set(
            serviceInfoArray.map((item) => item.category).filter(Boolean)
          ),
        ],
        versions: [
          ...new Set(
            serviceInfoArray.map((item) => item.version).filter(Boolean)
          ),
        ],
        statuses: [
          ...new Set(
            serviceInfoArray.map((item) => item.status).filter(Boolean)
          ),
        ],
      },
      distributions: {
        byStatus: basicStats.status || {},
        byCategory: basicStats.category || {},
        byVersion: basicStats.version || {},
      },
      insights: {
        mostCommonCategory: getMostCommon(serviceInfoArray, "category"),
        mostCommonStatus: getMostCommon(serviceInfoArray, "status"),
        latestVersion: getLatestVersion(serviceInfoArray),
        updateActivity: analyzeUpdateActivity(serviceInfoArray),
      },
    };

    return {
      ...basicStats,
      ...analytics,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error in getServiceInfoStatsService:", error);
    throw new Error("Failed to generate statistics: " + error.message);
  }
}

// Helper functions
function validateServiceInfoStructure(item) {
  const errors = [];

  if (!item.title) errors.push("Title is required");
  if (!item.description) errors.push("Description is required");
  if (!item.version) errors.push("Version is required");
  if (!item.status) errors.push("Status is required");

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function analyzeStatusDistribution(data) {
  return data.reduce((acc, item) => {
    const status = item.status || "unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
}

function analyzeCategoryDistribution(data) {
  return data.reduce((acc, item) => {
    const category = item.category || "uncategorized";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
}

function analyzeVersions(data) {
  const versions = data.map((item) => item.version).filter(Boolean);
  return {
    total: versions.length,
    unique: [...new Set(versions)],
    latest: getLatestVersion(data),
  };
}

function analyzeUpdateHistory(data) {
  const updates = data
    .map((item) => item.updated?.when)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a));

  return {
    totalUpdates: updates.length,
    latestUpdate: updates[0],
    oldestUpdate: updates[updates.length - 1],
  };
}

function getLastUpdatedDate(data) {
  const dates = data
    .map((item) => item.updated?.when)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a));

  return dates[0] || null;
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

function getLatestVersion(data) {
  const versions = data
    .map((item) => item.version)
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

  return versions[0] || null;
}

function analyzeUpdateActivity(data) {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recentUpdates = data.filter(
    (item) => item.updated?.when && new Date(item.updated.when) > oneWeekAgo
  );

  const monthlyUpdates = data.filter(
    (item) => item.updated?.when && new Date(item.updated.when) > oneMonthAgo
  );

  return {
    lastWeek: recentUpdates.length,
    lastMonth: monthlyUpdates.length,
    total: data.filter((item) => item.updated?.when).length,
  };
}
