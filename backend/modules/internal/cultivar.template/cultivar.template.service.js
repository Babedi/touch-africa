import {
  createCultivarTemplate,
  getCultivarTemplateById,
  updateCultivarTemplateById,
  deleteCultivarTemplateById,
  getAllCultivarTemplates,
} from "./cultivar.template.firestore.js";
import { newCultivarTemplateId } from "./cultivar.template.validation.js";
import { db } from "../../../services/firestore.client.js";
import {
  buildFirestoreQuery,
  applySearch,
  applyFieldSelection,
  createPaginationMeta,
  convertToCSV,
  convertToJSON,
} from "../../../utilities/query.util.js";

/**
 * Create a new cultivar template
 * @param {Object} templateData - Template data
 * @param {string} actor - User performing the action
 * @returns {Promise<Object>} Created template
 */
export const createTemplate = async (templateData, actor) => {
  const id = newCultivarTemplateId();
  const timestamp = new Date().toISOString();

  const templateWithMetadata = {
    id,
    ...templateData,
    created: {
      by: actor,
      when: timestamp,
    },
    updated: {
      by: actor,
      when: timestamp,
    },
    status: "active",
  };

  return await createCultivarTemplate(templateWithMetadata);
};

/**
 * Get template by ID
 * @param {string} id - Template ID
 * @returns {Promise<Object|null>} Template or null
 */
export const getTemplateById = async (id) => {
  return await getCultivarTemplateById(id);
};

/**
 * Update template by ID
 * @param {string} id - Template ID
 * @param {Object} updateData - Data to update
 * @param {string} actor - User performing the action
 * @returns {Promise<Object>} Updated template
 */
export const updateTemplateById = async (id, updateData, actor) => {
  const timestamp = new Date().toISOString();

  const dataWithMetadata = {
    ...updateData,
    updated: {
      by: actor,
      when: timestamp,
    },
  };

  return await updateCultivarTemplateById(id, dataWithMetadata);
};

/**
 * Delete template by ID
 * @param {string} id - Template ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteTemplateById = async (id) => {
  return await deleteCultivarTemplateById(id);
};

/**
 * Get all templates
 * @returns {Promise<Array>} Array of all templates
 */
export const getAllTemplates = async () => {
  return await getAllCultivarTemplates();
};

/**
 * List templates with comprehensive query support
 */
export async function listTemplatesService(queryParams = {}) {
  const {
    page = 1,
    limit = 20,
    fields,
    // Accept either validated 'sort' mapping or external 'sortBy'
    sort = queryParams.sort || queryParams.sortBy || "created.when",
    order = queryParams.order || "desc",
  } = queryParams;

  // Get base query
  const query = buildFirestoreQuery("cultivarTemplates", {
    page,
    limit,
    sort,
    order,
    filters: queryParams.filters || {},
  });

  // Execute query and get total count
  const [querySnapshot, totalCountSnapshot] = await Promise.all([
    query.get(),
    db.collection("cultivarTemplates").get(),
  ]);

  let templates = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Apply search if provided
  if (queryParams.search) {
    templates = applySearch(templates, queryParams.search, [
      "templateName",
      "description",
      "category",
      "cultivarType",
      "season",
    ]);
  }

  // Apply field selection
  if (fields) {
    templates = applyFieldSelection(templates, fields);
  }

  // Create pagination metadata
  const pagination = createPaginationMeta(
    page,
    limit,
    totalCountSnapshot.size,
    templates.length
  );

  return {
    data: templates,
    pagination,
  };
}

/**
 * Search templates service
 */
export async function searchTemplatesService(queryParams = {}) {
  const { search, limit = 20, fields } = queryParams;

  if (!search) {
    return {
      data: [],
      pagination: createPaginationMeta(1, limit, 0, 0),
    };
  }

  // Get all templates for search
  const snapshot = await db.collection("cultivarTemplates").get();
  let templates = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Apply search
  templates = applySearch(templates, search, [
    "templateName",
    "description",
    "category",
    "cultivarType",
    "season",
  ]);

  // Limit results
  const limitedTemplates = templates.slice(0, limit);

  // Apply field selection
  const finalTemplates = fields
    ? applyFieldSelection(limitedTemplates, fields)
    : limitedTemplates;

  return {
    data: finalTemplates,
    pagination: createPaginationMeta(
      1,
      limit,
      templates.length,
      limitedTemplates.length
    ),
  };
}

/**
 * Bulk operations service for templates
 */
export async function bulkTemplatesService(operation, data) {
  const results = [];
  const errors = [];

  try {
    switch (operation) {
      case "create":
        for (const templateData of data) {
          try {
            const result = await createTemplate(templateData);
            results.push({ operation: "create", success: true, data: result });
          } catch (error) {
            errors.push({
              operation: "create",
              error: error.message,
              data: templateData,
            });
          }
        }
        break;

      case "update":
        for (const item of data) {
          try {
            const result = await updateTemplateById(item.id, item.data);
            results.push({ operation: "update", success: true, data: result });
          } catch (error) {
            errors.push({
              operation: "update",
              error: error.message,
              data: item,
            });
          }
        }
        break;

      case "delete":
        for (const templateId of data) {
          try {
            await deleteTemplateById(templateId);
            results.push({
              operation: "delete",
              success: true,
              id: templateId,
            });
          } catch (error) {
            errors.push({
              operation: "delete",
              error: error.message,
              id: templateId,
            });
          }
        }
        break;

      default:
        throw new Error(`Unsupported bulk operation: ${operation}`);
    }

    return {
      success: errors.length === 0,
      results,
      errors,
      summary: {
        total: results.length + errors.length,
        successful: results.length,
        failed: errors.length,
      },
    };
  } catch (error) {
    throw new Error(`Bulk operation failed: ${error.message}`);
  }
}

/**
 * Export templates service
 */
export async function exportTemplatesService(
  format = "json",
  queryParams = {}
) {
  try {
    // Get templates with query parameters but without pagination
    const { fields, sort = "created.when", order = "desc" } = queryParams;

    // Get all templates
    const snapshot = await db
      .collection("cultivarTemplates")
      .orderBy(sort, order)
      .get();

    let templates = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply search if provided
    if (queryParams.search) {
      templates = applySearch(templates, queryParams.search, [
        "templateName",
        "description",
        "category",
        "cultivarType",
        "season",
      ]);
    }

    // Apply field selection
    if (fields) {
      templates = applyFieldSelection(templates, fields);
    }

    // Convert to requested format
    let exportData;
    let mimeType;
    let fileExtension;

    switch (format.toLowerCase()) {
      case "csv":
        exportData = convertToCSV(templates);
        mimeType = "text/csv";
        fileExtension = "csv";
        break;
      case "json":
      default:
        exportData = convertToJSON(templates);
        mimeType = "application/json";
        fileExtension = "json";
        break;
    }

    return {
      data: exportData,
      mimeType,
      fileExtension,
      filename: `cultivar-templates-${
        new Date().toISOString().split("T")[0]
      }.${fileExtension}`,
      totalRecords: templates.length,
    };
  } catch (error) {
    throw new Error(`Export failed: ${error.message}`);
  }
}

/**
 * Get templates statistics service
 */
export async function getTemplatesStatsService() {
  try {
    const snapshot = await db.collection("cultivarTemplates").get();
    const templates = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Basic statistics
    const stats = {
      total: templates.length,
      byCategory: {},
      byCultivarType: {},
      bySeason: {},
      recentActivity: {
        createdThisMonth: 0,
        updatedThisMonth: 0,
      },
    };

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    templates.forEach((template) => {
      // Count by category
      const category = template.category || "unknown";
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

      // Count by cultivar type
      const cultivarType = template.cultivarType || "unknown";
      stats.byCultivarType[cultivarType] =
        (stats.byCultivarType[cultivarType] || 0) + 1;

      // Count by season
      const season = template.season || "unknown";
      stats.bySeason[season] = (stats.bySeason[season] || 0) + 1;

      // Recent activity
      if (
        template.created?.when &&
        new Date(template.created.when) >= thisMonth
      ) {
        stats.recentActivity.createdThisMonth++;
      }
      if (
        template.updated?.when &&
        new Date(template.updated.when) >= thisMonth
      ) {
        stats.recentActivity.updatedThisMonth++;
      }
    });

    return stats;
  } catch (error) {
    throw new Error(`Failed to get template statistics: ${error.message}`);
  }
}
