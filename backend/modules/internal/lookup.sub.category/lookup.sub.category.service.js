import {
  createLookupSubCategory,
  getLookupSubCategoryById,
  updateLookupSubCategoryById,
  deleteLookupSubCategoryById,
  getAllLookupSubCategories,
} from "./lookup.sub.category.firestore.js";
import {
  paginateArray,
  sortArray,
  searchInArray,
  generateCSV,
  generateJSON,
  generateStats,
} from "../../../utilities/query.util.js";

/**
 * Create a new lookup sub category with metadata
 * @param {Object} lookupSubCategoryData - The lookup sub category data
 * @param {string} userId - The ID of the user creating the lookup sub category
 * @returns {Promise<Object>} Created lookup sub category with metadata
 */
export async function createLookupSubCategoryService(
  lookupSubCategoryData,
  userId
) {
  try {
    const now = new Date();
    const lookupSubCategoryWithMetadata = {
      ...lookupSubCategoryData,
      created: {
        by: userId,
        when: now,
      },
      updated: {
        by: userId,
        when: now,
      },
    };

    const createdLookupSubCategory = await createLookupSubCategory(
      lookupSubCategoryWithMetadata
    );

    console.log(
      `✅ Service: Created lookup sub category ${createdLookupSubCategory.id} by user ${userId}`
    );
    return createdLookupSubCategory;
  } catch (error) {
    console.error("❌ Service error creating lookup sub category:", error);
    throw error;
  }
}

/**
 * Get lookup sub category by ID
 * @param {string} id - The lookup sub category ID
 * @returns {Promise<Object|null>} Lookup sub category data or null if not found
 */
export async function getLookupSubCategoryByIdService(id) {
  try {
    const lookupSubCategory = await getLookupSubCategoryById(id);

    if (!lookupSubCategory) {
      console.log(`⚠️ Service: Lookup sub category not found: ${id}`);
      return null;
    }

    console.log(`✅ Service: Retrieved lookup sub category ${id}`);
    return lookupSubCategory;
  } catch (error) {
    console.error("❌ Service error getting lookup sub category:", error);
    throw error;
  }
}

/**
 * Update lookup sub category by ID with metadata
 * @param {string} id - The lookup sub category ID
 * @param {Object} updateData - The data to update
 * @param {string} userId - The ID of the user updating the lookup sub category
 * @returns {Promise<Object>} Updated lookup sub category
 */
export async function updateLookupSubCategoryByIdService(
  id,
  updateData,
  userId
) {
  try {
    const updateDataWithMetadata = {
      ...updateData,
      updated: {
        by: userId,
        when: new Date(),
      },
    };

    const updatedLookupSubCategory = await updateLookupSubCategoryById(
      id,
      updateDataWithMetadata
    );

    console.log(
      `✅ Service: Updated lookup sub category ${id} by user ${userId}`
    );
    return updatedLookupSubCategory;
  } catch (error) {
    console.error("❌ Service error updating lookup sub category:", error);
    throw error;
  }
}

/**
 * Delete lookup sub category by ID
 * @param {string} id - The lookup sub category ID
 * @param {string} userId - The ID of the user deleting the lookup sub category
 * @returns {Promise<void>}
 */
export async function deleteLookupSubCategoryByIdService(id, userId) {
  try {
    await deleteLookupSubCategoryById(id);

    console.log(
      `✅ Service: Deleted lookup sub category ${id} by user ${userId}`
    );
  } catch (error) {
    console.error("❌ Service error deleting lookup sub category:", error);
    throw error;
  }
}

/**
 * Get all lookup sub categories
 * @returns {Promise<Array>} Array of all lookup sub categories
 */
export async function getAllLookupSubCategoriesService() {
  try {
    const lookupSubCategories = await getAllLookupSubCategories();

    console.log(
      `✅ Service: Retrieved ${lookupSubCategories.length} lookup sub categories`
    );
    return lookupSubCategories;
  } catch (error) {
    console.error("❌ Service error getting all lookup sub categories:", error);
    throw error;
  }
}

/**
 * Get lookup sub categories by subcategory name (case-insensitive search)
 * @param {string} subcategory - The subcategory to search for
 * @returns {Promise<Array>} Array of matching lookup sub categories
 */
export async function getLookupSubCategoriesBySubcategoryService(subcategory) {
  try {
    const allLookupSubCategories = await getAllLookupSubCategories();

    const matchingSubCategories = allLookupSubCategories.filter(
      (lookupSubCategory) =>
        lookupSubCategory.subcategory
          .toLowerCase()
          .includes(subcategory.toLowerCase())
    );

    console.log(
      `✅ Service: Found ${matchingSubCategories.length} lookup sub categories matching '${subcategory}'`
    );
    return matchingSubCategories;
  } catch (error) {
    console.error("❌ Service error searching lookup sub categories:", error);
    throw error;
  }
}

/**
 * Check if a lookup sub category exists by ID
 * @param {string} id - The lookup sub category ID
 * @returns {Promise<boolean>} True if exists, false otherwise
 */
export async function lookupSubCategoryExistsService(id) {
  try {
    const lookupSubCategory = await getLookupSubCategoryById(id);
    return lookupSubCategory !== null;
  } catch (error) {
    console.error(
      "❌ Service error checking lookup sub category existence:",
      error
    );
    throw error;
  }
}

/**
 * List lookup sub categories with comprehensive query support
 * @param {Object} queryParams - Query parameters for filtering, sorting, pagination
 * @returns {Object} Paginated and filtered lookup sub categories list
 */
export async function listLookupSubCategoriesService(queryParams = {}) {
  try {
    // Get all lookup sub categories from Firestore
    const lookupSubCategories = await getAllLookupSubCategories();

    // Apply search if search term provided
    let filteredData = lookupSubCategories;
    if (queryParams.search) {
      const searchFields = [
        "name",
        "description",
        "categoryId",
        "code",
        "parentCategory",
      ];
      filteredData = searchInArray(
        filteredData,
        queryParams.search,
        searchFields
      );
    }

    // Apply additional filters
    if (queryParams.categoryId) {
      filteredData = filteredData.filter(
        (subCategory) => subCategory.categoryId === queryParams.categoryId
      );
    }

    if (queryParams.status) {
      filteredData = filteredData.filter(
        (subCategory) => subCategory.status === queryParams.status
      );
    }

    if (queryParams.code) {
      filteredData = filteredData.filter(
        (subCategory) =>
          subCategory.code &&
          subCategory.code
            .toLowerCase()
            .includes(queryParams.code.toLowerCase())
      );
    }

    if (queryParams.parentCategory) {
      filteredData = filteredData.filter(
        (subCategory) =>
          subCategory.parentCategory &&
          subCategory.parentCategory
            .toLowerCase()
            .includes(queryParams.parentCategory.toLowerCase())
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
    console.error("Error in listLookupSubCategoriesService:", error);
    throw new Error("Failed to list lookup sub categories: " + error.message);
  }
}

/**
 * Search lookup sub categories with enhanced query capabilities
 * @param {Object} queryParams - Search and filter parameters
 * @returns {Object} Search results with pagination
 */
export async function searchLookupSubCategoriesService(queryParams = {}) {
  try {
    // Get all lookup sub categories
    const lookupSubCategories = await getAllLookupSubCategories();

    let searchResults = lookupSubCategories;

    // Enhanced search across multiple fields
    if (queryParams.q || queryParams.search) {
      const searchTerm = queryParams.q || queryParams.search;
      const searchFields = [
        "name",
        "description",
        "categoryId",
        "code",
        "parentCategory",
        "displayName",
        "created.by",
        "updated.by",
      ];
      searchResults = searchInArray(searchResults, searchTerm, searchFields);
    }

    // Advanced filtering options
    if (queryParams.categoryFilter) {
      searchResults = searchResults.filter(
        (subCategory) => subCategory.categoryId === queryParams.categoryFilter
      );
    }

    if (queryParams.statusFilter) {
      searchResults = searchResults.filter(
        (subCategory) => subCategory.status === queryParams.statusFilter
      );
    }

    if (queryParams.codeFilter) {
      searchResults = searchResults.filter(
        (subCategory) =>
          subCategory.code && subCategory.code.includes(queryParams.codeFilter)
      );
    }

    if (queryParams.parentCategoryFilter) {
      searchResults = searchResults.filter(
        (subCategory) =>
          subCategory.parentCategory &&
          subCategory.parentCategory.includes(queryParams.parentCategoryFilter)
      );
    }

    // Date range filtering
    if (queryParams.createdAfter) {
      const afterDate = new Date(queryParams.createdAfter);
      searchResults = searchResults.filter(
        (subCategory) =>
          subCategory.created &&
          subCategory.created.when &&
          new Date(subCategory.created.when) > afterDate
      );
    }

    if (queryParams.createdBefore) {
      const beforeDate = new Date(queryParams.createdBefore);
      searchResults = searchResults.filter(
        (subCategory) =>
          subCategory.created &&
          subCategory.created.when &&
          new Date(subCategory.created.when) < beforeDate
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
        category: queryParams.categoryFilter,
        status: queryParams.statusFilter,
        code: queryParams.codeFilter,
        parentCategory: queryParams.parentCategoryFilter,
        dateRange: {
          after: queryParams.createdAfter,
          before: queryParams.createdBefore,
        },
      },
    };
  } catch (error) {
    console.error("Error in searchLookupSubCategoriesService:", error);
    throw new Error("Failed to search lookup sub categories: " + error.message);
  }
}

/**
 * Bulk operations for lookup sub categories
 * @param {string} operation - Type of bulk operation (create, update, delete, validate)
 * @param {Array} data - Array of lookup sub category data for processing
 * @returns {Object} Results of bulk operation
 */
export async function bulkLookupSubCategoriesService(operation, data = []) {
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
        for (const [index, subCategoryData] of data.entries()) {
          try {
            const created = await createLookupSubCategoryService(
              subCategoryData,
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
              data: subCategoryData,
            });
          }
          results.processed++;
        }
        break;

      case "update":
        for (const [index, subCategoryData] of data.entries()) {
          try {
            if (!subCategoryData.id) {
              throw new Error("ID is required for update operation");
            }
            const updated = await updateLookupSubCategoryByIdService(
              subCategoryData.id,
              subCategoryData,
              "bulk_operation"
            );
            results.successful++;
            results.data.push({
              index,
              id: subCategoryData.id,
              status: "updated",
              data: updated,
            });
          } catch (error) {
            results.failed++;
            results.errors.push({
              index,
              error: error.message,
              data: subCategoryData,
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
            await deleteLookupSubCategoryByIdService(id, "bulk_operation");
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
        for (const [index, subCategoryData] of data.entries()) {
          try {
            const validation = validateLookupSubCategoryData(subCategoryData);
            if (validation.isValid) {
              results.successful++;
              results.data.push({
                index,
                status: "valid",
                data: subCategoryData,
              });
            } else {
              results.failed++;
              results.errors.push({
                index,
                error: validation.errors.join(", "),
                data: subCategoryData,
              });
            }
            results.processed++;
          } catch (error) {
            results.failed++;
            results.errors.push({
              index,
              error: error.message,
              data: subCategoryData,
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
    console.error("Error in bulkLookupSubCategoriesService:", error);
    throw new Error("Bulk operation failed: " + error.message);
  }
}

/**
 * Export lookup sub categories in various formats
 * @param {string} format - Export format (json, csv)
 * @param {Object} queryParams - Query parameters for filtering data to export
 * @returns {Object} Export data with appropriate formatting
 */
export async function exportLookupSubCategoriesService(
  format = "json",
  queryParams = {}
) {
  try {
    // Get filtered data using the list service
    const { data } = await listLookupSubCategoriesService(queryParams);

    let exportData;
    let mimeType;
    let filename;

    switch (format.toLowerCase()) {
      case "csv":
        const csvFields = [
          "id",
          "name",
          "description",
          "categoryId",
          "parentCategory",
          "code",
          "status",
          "created.by",
          "created.when",
          "updated.by",
          "updated.when",
        ];
        exportData = generateCSV(data, csvFields);
        mimeType = "text/csv";
        filename = `lookup_sub_categories_export_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        break;

      case "json":
      default:
        exportData = generateJSON(data);
        mimeType = "application/json";
        filename = `lookup_sub_categories_export_${
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
    console.error("Error in exportLookupSubCategoriesService:", error);
    throw new Error("Export failed: " + error.message);
  }
}

/**
 * Get lookup sub categories statistics and analytics
 * @returns {Object} Comprehensive statistics about lookup sub categories
 */
export async function getLookupSubCategoriesStatsService() {
  try {
    const lookupSubCategories = await getAllLookupSubCategories();

    // Generate basic statistics
    const basicStats = generateStats(lookupSubCategories, [
      "categoryId",
      "status",
      "parentCategory",
    ]);

    // Custom lookup sub category analytics
    const analytics = {
      overview: {
        total: lookupSubCategories.length,
        uniqueCategories: [
          ...new Set(
            lookupSubCategories.map((sub) => sub.categoryId).filter(Boolean)
          ),
        ],
        statuses: [
          ...new Set(
            lookupSubCategories.map((sub) => sub.status).filter(Boolean)
          ),
        ],
        parentCategories: [
          ...new Set(
            lookupSubCategories.map((sub) => sub.parentCategory).filter(Boolean)
          ),
        ],
      },
      distributions: {
        byCategory: basicStats.categoryId || {},
        byStatus: basicStats.status || {},
        byParentCategory: basicStats.parentCategory || {},
      },
      insights: {
        mostPopularCategory: getMostCommon(lookupSubCategories, "categoryId"),
        subcategoriesWithoutCode: lookupSubCategories.filter((sub) => !sub.code)
          .length,
        subcategoriesWithoutDescription: lookupSubCategories.filter(
          (sub) => !sub.description
        ).length,
        categoriesWithMostSubcategories:
          getCategoriesWithMostSubcategories(lookupSubCategories),
        recentlyCreated: getRecentlyCreated(lookupSubCategories),
        recentlyUpdated: getRecentlyUpdated(lookupSubCategories),
      },
    };

    return {
      total: lookupSubCategories.length,
      ...basicStats,
      ...analytics,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error in getLookupSubCategoriesStatsService:", error);
    throw new Error("Failed to generate statistics: " + error.message);
  }
}

// Helper functions
function validateLookupSubCategoryData(data) {
  const errors = [];

  if (!data.name) errors.push("Name is required");
  if (!data.categoryId) errors.push("Category ID is required");
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

function getCategoriesWithMostSubcategories(data) {
  const counts = data.reduce((acc, item) => {
    const categoryId = item.categoryId;
    if (categoryId) {
      acc[categoryId] = (acc[categoryId] || 0) + 1;
    }
    return acc;
  }, {});

  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));
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
