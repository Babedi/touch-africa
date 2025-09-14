import {
  createLookupCategory,
  getLookupCategoryById,
  updateLookupCategoryById,
  deleteLookupCategoryById,
  getAllLookupCategories,
} from "./lookup.category.firestore.js";
import {
  paginateArray,
  sortArray,
  searchInArray,
  generateCSV,
  generateJSON,
  generateStats,
} from "../../../utilities/query.util.js";

/**
 * Create a new lookup category with metadata
 * @param {Object} lookupCategoryData - The lookup category data
 * @param {string} userId - The ID of the user creating the lookup category
 * @returns {Promise<Object>} Created lookup category with metadata
 */
export async function createLookupCategoryService(lookupCategoryData, userId) {
  try {
    const now = new Date();
    const lookupCategoryWithMetadata = {
      ...lookupCategoryData,
      created: {
        by: userId,
        when: now,
      },
      updated: {
        by: userId,
        when: now,
      },
    };

    const createdLookupCategory = await createLookupCategory(
      lookupCategoryWithMetadata
    );

    console.log(
      `✅ Service: Created lookup category ${createdLookupCategory.id} by user ${userId}`
    );
    return createdLookupCategory;
  } catch (error) {
    console.error("❌ Service error creating lookup category:", error);
    throw error;
  }
}

/**
 * Get lookup category by ID
 * @param {string} id - The lookup category ID
 * @returns {Promise<Object|null>} Lookup category data or null if not found
 */
export async function getLookupCategoryByIdService(id) {
  try {
    const lookupCategory = await getLookupCategoryById(id);

    if (!lookupCategory) {
      console.log(`⚠️ Service: Lookup category not found: ${id}`);
      return null;
    }

    console.log(`✅ Service: Retrieved lookup category ${id}`);
    return lookupCategory;
  } catch (error) {
    console.error("❌ Service error getting lookup category:", error);
    throw error;
  }
}

/**
 * Update lookup category by ID with metadata
 * @param {string} id - The lookup category ID
 * @param {Object} updateData - The data to update
 * @param {string} userId - The ID of the user updating the lookup category
 * @returns {Promise<Object>} Updated lookup category
 */
export async function updateLookupCategoryByIdService(id, updateData, userId) {
  try {
    const updateDataWithMetadata = {
      ...updateData,
      updated: {
        by: userId,
        when: new Date(),
      },
    };

    const updatedLookupCategory = await updateLookupCategoryById(
      id,
      updateDataWithMetadata
    );

    console.log(`✅ Service: Updated lookup category ${id} by user ${userId}`);
    return updatedLookupCategory;
  } catch (error) {
    console.error("❌ Service error updating lookup category:", error);
    throw error;
  }
}

/**
 * Delete lookup category by ID
 * @param {string} id - The lookup category ID
 * @param {string} userId - The ID of the user deleting the lookup category
 * @returns {Promise<void>}
 */
export async function deleteLookupCategoryByIdService(id, userId) {
  try {
    await deleteLookupCategoryById(id);

    console.log(`✅ Service: Deleted lookup category ${id} by user ${userId}`);
  } catch (error) {
    console.error("❌ Service error deleting lookup category:", error);
    throw error;
  }
}

/**
 * Get all lookup categories
 * @returns {Promise<Array>} Array of all lookup categories
 */
export async function getAllLookupCategoriesService() {
  try {
    const lookupCategories = await getAllLookupCategories();

    console.log(
      `✅ Service: Retrieved ${lookupCategories.length} lookup categories`
    );
    return lookupCategories;
  } catch (error) {
    console.error("❌ Service error getting all lookup categories:", error);
    throw error;
  }
}

/**
 * Get lookup categories by category name (case-insensitive search)
 * @param {string} category - The category to search for
 * @returns {Promise<Array>} Array of matching lookup categories
 */
export async function getLookupCategoriesByCategoryService(category) {
  try {
    const allLookupCategories = await getAllLookupCategories();

    const matchingCategories = allLookupCategories.filter((lookupCategory) =>
      lookupCategory.category.toLowerCase().includes(category.toLowerCase())
    );

    console.log(
      `✅ Service: Found ${matchingCategories.length} lookup categories matching '${category}'`
    );
    return matchingCategories;
  } catch (error) {
    console.error("❌ Service error searching lookup categories:", error);
    throw error;
  }
}

/**
 * Check if a lookup category exists by ID
 * @param {string} id - The lookup category ID
 * @returns {Promise<boolean>} True if exists, false otherwise
 */
export async function lookupCategoryExistsService(id) {
  try {
    const lookupCategory = await getLookupCategoryById(id);
    return lookupCategory !== null;
  } catch (error) {
    console.error(
      "❌ Service error checking lookup category existence:",
      error
    );
    throw error;
  }
}

/**
 * List lookup categories with comprehensive query support
 * @param {Object} queryParams - Query parameters for filtering, sorting, pagination
 * @returns {Object} Paginated and filtered lookup categories list
 */
export async function listLookupCategoriesService(queryParams = {}) {
  try {
    // Get all lookup categories from Firestore
    const lookupCategories = await getAllLookupCategories();

    // Apply search if search term provided
    let filteredData = lookupCategories;
    if (queryParams.search) {
      const searchFields = ["name", "description", "type", "code"];
      filteredData = searchInArray(
        filteredData,
        queryParams.search,
        searchFields
      );
    }

    // Apply additional filters
    if (queryParams.type) {
      filteredData = filteredData.filter(
        (category) =>
          category.type &&
          category.type.toLowerCase().includes(queryParams.type.toLowerCase())
      );
    }

    if (queryParams.status) {
      filteredData = filteredData.filter(
        (category) => category.status === queryParams.status
      );
    }

    if (queryParams.code) {
      filteredData = filteredData.filter(
        (category) =>
          category.code &&
          category.code.toLowerCase().includes(queryParams.code.toLowerCase())
      );
    }

    // Apply sorting
    const sortField = queryParams.sortBy || "name";
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
    console.error("Error in listLookupCategoriesService:", error);
    throw new Error("Failed to list lookup categories: " + error.message);
  }
}

/**
 * Search lookup categories with enhanced query capabilities
 * @param {Object} queryParams - Search and filter parameters
 * @returns {Object} Search results with pagination
 */
export async function searchLookupCategoriesService(queryParams = {}) {
  try {
    // Get all lookup categories
    const lookupCategories = await getAllLookupCategories();

    let searchResults = lookupCategories;

    // Enhanced search across multiple fields
    if (queryParams.q || queryParams.search) {
      const searchTerm = queryParams.q || queryParams.search;
      const searchFields = [
        "name",
        "description",
        "type",
        "code",
        "displayName",
        "created.by",
        "updated.by",
      ];
      searchResults = searchInArray(searchResults, searchTerm, searchFields);
    }

    // Advanced filtering options
    if (queryParams.typeFilter) {
      searchResults = searchResults.filter(
        (category) => category.type === queryParams.typeFilter
      );
    }

    if (queryParams.statusFilter) {
      searchResults = searchResults.filter(
        (category) => category.status === queryParams.statusFilter
      );
    }

    if (queryParams.codeFilter) {
      searchResults = searchResults.filter(
        (category) =>
          category.code && category.code.includes(queryParams.codeFilter)
      );
    }

    // Date range filtering
    if (queryParams.createdAfter) {
      const afterDate = new Date(queryParams.createdAfter);
      searchResults = searchResults.filter(
        (category) =>
          category.created &&
          category.created.when &&
          new Date(category.created.when) > afterDate
      );
    }

    if (queryParams.createdBefore) {
      const beforeDate = new Date(queryParams.createdBefore);
      searchResults = searchResults.filter(
        (category) =>
          category.created &&
          category.created.when &&
          new Date(category.created.when) < beforeDate
      );
    }

    // Sorting
    const sortField = queryParams.sortBy || "name";
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
        type: queryParams.typeFilter,
        status: queryParams.statusFilter,
        code: queryParams.codeFilter,
        dateRange: {
          after: queryParams.createdAfter,
          before: queryParams.createdBefore,
        },
      },
    };
  } catch (error) {
    console.error("Error in searchLookupCategoriesService:", error);
    throw new Error("Failed to search lookup categories: " + error.message);
  }
}

/**
 * Bulk operations for lookup categories
 * @param {string} operation - Type of bulk operation (create, update, delete, validate)
 * @param {Array} data - Array of lookup category data for processing
 * @returns {Object} Results of bulk operation
 */
export async function bulkLookupCategoriesService(operation, data = []) {
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
        for (const [index, categoryData] of data.entries()) {
          try {
            const created = await createLookupCategoryService(
              categoryData,
              "bulk_operation"
            );
            results.successful++;
            results.data.push({
              index,
              id: created.id,
              status: "created",
              data: created,
            });
          } catch (error) {
            results.failed++;
            results.errors.push({
              index,
              error: error.message,
              data: categoryData,
            });
          }
          results.processed++;
        }
        break;

      case "update":
        for (const [index, categoryData] of data.entries()) {
          try {
            if (!categoryData.id) {
              throw new Error("ID is required for update operation");
            }
            const updated = await updateLookupCategoryByIdService(
              categoryData.id,
              categoryData,
              "bulk_operation"
            );
            results.successful++;
            results.data.push({
              index,
              id: categoryData.id,
              status: "updated",
              data: updated,
            });
          } catch (error) {
            results.failed++;
            results.errors.push({
              index,
              error: error.message,
              data: categoryData,
            });
          }
          results.processed++;
        }
        break;

      case "delete":
        for (const [index, item] of data.entries()) {
          try {
            const id = typeof item === "string" ? item : item.id;
            if (!id) {
              throw new Error("ID is required for delete operation");
            }
            await deleteLookupCategoryByIdService(id, "bulk_operation");
            results.successful++;
            results.data.push({
              index,
              id,
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
        for (const [index, categoryData] of data.entries()) {
          try {
            const validation = validateLookupCategoryData(categoryData);
            if (validation.isValid) {
              results.successful++;
              results.data.push({
                index,
                status: "valid",
                data: categoryData,
              });
            } else {
              results.failed++;
              results.errors.push({
                index,
                error: validation.errors.join(", "),
                data: categoryData,
              });
            }
            results.processed++;
          } catch (error) {
            results.failed++;
            results.errors.push({
              index,
              error: error.message,
              data: categoryData,
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
    console.error("Error in bulkLookupCategoriesService:", error);
    throw new Error("Bulk operation failed: " + error.message);
  }
}

/**
 * Export lookup categories in various formats
 * @param {string} format - Export format (json, csv)
 * @param {Object} queryParams - Query parameters for filtering data to export
 * @returns {Object} Export data with appropriate formatting
 */
export async function exportLookupCategoriesService(
  format = "json",
  queryParams = {}
) {
  try {
    // Get filtered data using the list service
    const { data } = await listLookupCategoriesService(queryParams);

    let exportData;
    let mimeType;
    let filename;

    switch (format.toLowerCase()) {
      case "csv":
        const csvFields = [
          "id",
          "name",
          "description",
          "type",
          "code",
          "status",
          "created.by",
          "created.when",
          "updated.by",
          "updated.when",
        ];
        exportData = generateCSV(data, csvFields);
        mimeType = "text/csv";
        filename = `lookup_categories_export_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        break;

      case "json":
      default:
        exportData = generateJSON(data);
        mimeType = "application/json";
        filename = `lookup_categories_export_${
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
    console.error("Error in exportLookupCategoriesService:", error);
    throw new Error("Export failed: " + error.message);
  }
}

/**
 * Get lookup categories statistics and analytics
 * @returns {Object} Comprehensive statistics about lookup categories
 */
export async function getLookupCategoriesStatsService() {
  try {
    const lookupCategories = await getAllLookupCategories();

    // Generate basic statistics
    const basicStats = generateStats(lookupCategories, ["type", "status"]);

    // Custom lookup category analytics
    const analytics = {
      overview: {
        total: lookupCategories.length,
        types: [
          ...new Set(lookupCategories.map((cat) => cat.type).filter(Boolean)),
        ],
        statuses: [
          ...new Set(lookupCategories.map((cat) => cat.status).filter(Boolean)),
        ],
        codes: [
          ...new Set(lookupCategories.map((cat) => cat.code).filter(Boolean)),
        ],
      },
      distributions: {
        byType: basicStats.type || {},
        byStatus: basicStats.status || {},
      },
      insights: {
        mostCommonType: getMostCommon(lookupCategories, "type"),
        categoriesWithoutCode: lookupCategories.filter((cat) => !cat.code)
          .length,
        categoriesWithoutDescription: lookupCategories.filter(
          (cat) => !cat.description
        ).length,
        recentlyCreated: getRecentlyCreated(lookupCategories),
        recentlyUpdated: getRecentlyUpdated(lookupCategories),
      },
    };

    return {
      total: lookupCategories.length,
      ...basicStats,
      ...analytics,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error in getLookupCategoriesStatsService:", error);
    throw new Error("Failed to generate statistics: " + error.message);
  }
}

// Helper functions
function validateLookupCategoryData(data) {
  const errors = [];

  if (!data.name) errors.push("Name is required");
  if (!data.type) errors.push("Type is required");
  if (data.code && typeof data.code !== "string")
    errors.push("Code must be a string");

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
