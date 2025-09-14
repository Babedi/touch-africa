import {
  createLookup,
  getLookupById,
  updateLookupById,
  deleteLookupById,
  getAllLookups,
} from "./lookup.firestore.js";
import { newLookupId } from "./lookup.validation.js";
import {
  paginateArray,
  sortArray,
  searchInArray,
  generateCSV,
  generateJSON,
  generateStats,
} from "../../../utilities/query.util.js";

/**
 * Create a new lookup with metadata
 * @param {Object} lookupData - The lookup data
 * @param {string} actor - The user creating the lookup
 * @returns {Promise<Object>} - The created lookup with metadata
 */
export async function createLookupService(lookupData, actor) {
  const id = newLookupId();
  const now = new Date().toISOString();

  const lookupWithMetadata = {
    id,
    ...lookupData,
    created: {
      by: actor,
      when: now,
    },
    updated: {
      by: actor,
      when: now,
    },
    active: true,
  };

  await createLookup(lookupWithMetadata);
  return lookupWithMetadata;
}

/**
 * Get lookup by ID
 * @param {string} id - The lookup ID
 * @returns {Promise<Object|null>} - The lookup data or null
 */
export async function getLookupService(id) {
  return await getLookupById(id);
}

/**
 * Update lookup by ID
 * @param {string} id - The lookup ID
 * @param {Object} updateData - The data to update
 * @param {string} actor - The user updating the lookup
 * @returns {Promise<Object>} - The updated lookup
 */
export async function updateLookupService(id, updateData, actor) {
  const now = new Date().toISOString();

  const updateWithMetadata = {
    ...updateData,
    updated: {
      by: actor,
      when: now,
    },
  };

  await updateLookupById(id, updateWithMetadata);
  return await getLookupById(id);
}

/**
 * Delete lookup by ID
 * @param {string} id - The lookup ID
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteLookupService(id) {
  return await deleteLookupById(id);
}

/**
 * Get all lookups
 * @returns {Promise<Array>} - Array of all lookups
 */
export async function getAllLookupsService() {
  return await getAllLookups();
}

/**
 * List lookups with comprehensive query support
 * @param {Object} queryParams
 */
export async function listLookupsService(queryParams = {}) {
  try {
    const lookups = await getAllLookups();

    let filtered = lookups;

    // Text search across key fields
    if (queryParams.search) {
      const fields = ["id", "category", "subCategory", "description", "items"];
      filtered = searchInArray(filtered, queryParams.search, fields);
    }

    // Field filters
    if (queryParams.category) {
      filtered = filtered.filter(
        (x) =>
          x.category &&
          String(x.category)
            .toLowerCase()
            .includes(String(queryParams.category).toLowerCase())
      );
    }
    if (queryParams.subCategory) {
      filtered = filtered.filter(
        (x) =>
          x.subCategory &&
          String(x.subCategory)
            .toLowerCase()
            .includes(String(queryParams.subCategory).toLowerCase())
      );
    }
    if (queryParams.active != null) {
      const want = String(queryParams.active).toLowerCase() === "true";
      filtered = filtered.filter((x) => x.active === want);
    }

    // Sorting and pagination
    const sortField = queryParams.sortBy || "category";
    const sortDirection = queryParams.sortDirection || "asc";
    const sorted = sortArray(filtered, sortField, sortDirection);

    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    const result = paginateArray(sorted, page, limit);

    return { data: result.data, pagination: result.pagination };
  } catch (error) {
    console.error("Error in listLookupsService:", error);
    throw new Error("Failed to list lookups: " + error.message);
  }
}

/**
 * Search lookups with enhanced query capabilities
 */
export async function searchLookupsService(queryParams = {}) {
  try {
    const lookups = await getAllLookups();
    let results = lookups;

    if (queryParams.q || queryParams.search) {
      const term = queryParams.q || queryParams.search;
      const fields = [
        "id",
        "category",
        "subCategory",
        "description",
        "items",
        "created.by",
        "updated.by",
      ];
      results = searchInArray(results, term, fields);
    }

    // Optional advanced filters
    if (queryParams.createdAfter) {
      const after = new Date(queryParams.createdAfter);
      results = results.filter(
        (x) => x?.created?.when && new Date(x.created.when) > after
      );
    }
    if (queryParams.createdBefore) {
      const before = new Date(queryParams.createdBefore);
      results = results.filter(
        (x) => x?.created?.when && new Date(x.created.when) < before
      );
    }

    const sortField = queryParams.sortBy || "category";
    const sortDirection = queryParams.sortDirection || "asc";
    const sorted = sortArray(results, sortField, sortDirection);

    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    const result = paginateArray(sorted, page, limit);

    return {
      data: result.data,
      pagination: result.pagination,
      searchTerm: queryParams.q || queryParams.search,
    };
  } catch (error) {
    console.error("Error in searchLookupsService:", error);
    throw new Error("Failed to search lookups: " + error.message);
  }
}

/**
 * Bulk operations for lookups
 */
export async function bulkLookupsService(operation, data = []) {
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

    switch (String(operation).toLowerCase()) {
      case "create":
        for (const [index, payload] of data.entries()) {
          try {
            const created = await createLookupService(
              payload,
              "bulk_operation"
            );
            results.successful++;
            results.data.push({
              index,
              id: created.id,
              status: "created",
              data: created,
            });
          } catch (err) {
            results.failed++;
            results.errors.push({ index, error: err.message, data: payload });
          }
          results.processed++;
        }
        break;
      case "update":
        for (const [index, payload] of data.entries()) {
          try {
            const id = payload?.id;
            if (!id) throw new Error("ID is required for update operation");
            const updated = await updateLookupService(
              id,
              payload,
              "bulk_operation"
            );
            results.successful++;
            results.data.push({ index, id, status: "updated", data: updated });
          } catch (err) {
            results.failed++;
            results.errors.push({ index, error: err.message, data: payload });
          }
          results.processed++;
        }
        break;
      case "delete":
        for (const [index, item] of data.entries()) {
          try {
            const id = typeof item === "string" ? item : item?.id;
            if (!id) throw new Error("ID is required for delete operation");
            await deleteLookupService(id);
            results.successful++;
            results.data.push({ index, id, status: "deleted" });
          } catch (err) {
            results.failed++;
            results.errors.push({ index, error: err.message, data: item });
          }
          results.processed++;
        }
        break;
      default:
        throw new Error(`Unsupported bulk operation: ${operation}`);
    }

    results.success = results.failed === 0;
    return results;
  } catch (error) {
    console.error("Error in bulkLookupsService:", error);
    throw new Error("Bulk operation failed: " + error.message);
  }
}

/**
 * Export lookups
 */
export async function exportLookupsService(format = "json", queryParams = {}) {
  try {
    const { data } = await listLookupsService(queryParams);
    let payload, mimeType, filename;

    switch (String(format).toLowerCase()) {
      case "csv":
        payload = generateCSV(data, [
          "id",
          "category",
          "subCategory",
          "description",
          "items",
          "active",
          "created.by",
          "created.when",
          "updated.by",
          "updated.when",
        ]);
        mimeType = "text/csv";
        filename = `lookups_export_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        break;
      case "json":
      default:
        payload = generateJSON(data);
        mimeType = "application/json";
        filename = `lookups_export_${
          new Date().toISOString().split("T")[0]
        }.json`;
        break;
    }

    return { data: payload, mimeType, filename, recordCount: data.length };
  } catch (error) {
    console.error("Error in exportLookupsService:", error);
    throw new Error("Export failed: " + error.message);
  }
}

/**
 * Stats for lookups
 */
export async function getLookupsStatsService() {
  try {
    const lookups = await getAllLookups();
    const basic = generateStats(lookups, ["category", "subCategory", "active"]);

    const insights = {
      total: lookups.length,
      activeCount: lookups.filter((x) => x.active === true).length,
      inactiveCount: lookups.filter((x) => x.active === false).length,
      categories: [...new Set(lookups.map((x) => x.category).filter(Boolean))],
      subCategories: [
        ...new Set(lookups.map((x) => x.subCategory).filter(Boolean)),
      ],
    };

    return { total: lookups.length, ...basic, insights, generatedAt: new Date().toISOString() };
  } catch (error) {
    console.error("Error in getLookupsStatsService:", error);
    throw new Error("Failed to generate statistics: " + error.message);
  }
}
