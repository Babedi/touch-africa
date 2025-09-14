import {
  createLookupCategoryService,
  getLookupCategoryByIdService,
  updateLookupCategoryByIdService,
  deleteLookupCategoryByIdService,
  getAllLookupCategoriesService,
  getLookupCategoriesByCategoryService,
  lookupCategoryExistsService,
  listLookupCategoriesService,
  searchLookupCategoriesService,
  bulkLookupCategoriesService,
  exportLookupCategoriesService,
  getLookupCategoriesStatsService,
} from "./lookup.category.service.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../middleware/permission.middleware.js";
import {
  LookupCategorySchema,
  LookupCategoryUpdateSchema,
  isValidLookupCategoryId,
} from "./lookup.category.validation.js";
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  handleZodError,
} from "../../../utilities/response.util.js";

// Define authorization roles for this module
// Permissions defined in route handlers directly

// Permissions defined in route handlers directly

/**
 * Create a new lookup category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function createLookupCategory(req, res) {
  try {
    // Validate request body
    const validationResult = LookupCategorySchema.safeParse(req.body);
    if (!validationResult.success) {
      return sendValidationError(
        res,
        "Validation failed",
        validationResult.error.errors
      );
    }

    const lookupCategoryData = validationResult.data;
    const userId = req.admin?.id || req.user?.id || req.user?.email || "system";

    // Create lookup category
    const createdLookupCategory = await createLookupCategoryService(
      lookupCategoryData,
      userId
    );

    console.log(
      `✅ Controller: Created lookup category ${createdLookupCategory.id}`
    );

    return sendSuccess(
      res,
      createdLookupCategory,
      "Lookup category created successfully",
      201
    );
  } catch (error) {
    console.error("❌ Controller error creating lookup category:", error);
    return sendError(
      res,
      "CREATE_FAILED",
      "Failed to create lookup category",
      null,
      500
    );
  }
}

/**
 * Get lookup category by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getLookupCategoryById(req, res) {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!isValidLookupCategoryId(id)) {
      return sendValidationError(res, "Invalid lookup category ID format");
    }

    // Get lookup category
    const lookupCategory = await getLookupCategoryByIdService(id);

    if (!lookupCategory) {
      return sendNotFound(res, "Lookup category not found");
    }

    console.log(`✅ Controller: Retrieved lookup category ${id}`);

    return sendSuccess(
      res,
      lookupCategory,
      "Lookup category retrieved successfully"
    );
  } catch (error) {
    console.error("❌ Controller error getting lookup category:", error);
    return sendError(
      res,
      "FETCH_FAILED",
      "Failed to get lookup category",
      null,
      500
    );
  }
}

/**
 * Update lookup category by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function updateLookupCategoryById(req, res) {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!isValidLookupCategoryId(id)) {
      return sendValidationError(res, "Invalid lookup category ID format");
    }

    // Validate request body
    const validationResult = LookupCategoryUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return handleZodError(res, validationResult.error);
    }

    const updateData = validationResult.data;
    const userId = req.admin?.id || req.user?.id || req.user?.email || "system";

    // Update lookup category
    const updatedLookupCategory = await updateLookupCategoryByIdService(
      id,
      updateData,
      userId
    );

    console.log(`✅ Controller: Updated lookup category ${id}`);

    return sendSuccess(
      res,
      updatedLookupCategory,
      "Lookup category updated successfully"
    );
  } catch (error) {
    console.error("❌ Controller error updating lookup category:", error);

    if (error.message.includes("not found")) {
      return sendNotFound(res, "Lookup category not found");
    }

    return sendError(
      res,
      "UPDATE_FAILED",
      "Failed to update lookup category",
      null,
      500
    );
  }
}

/**
 * Delete lookup category by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function deleteLookupCategoryById(req, res) {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!isValidLookupCategoryId(id)) {
      return sendValidationError(res, "Invalid lookup category ID format");
    }

    const userId = req.admin?.id || req.user?.id || req.user?.email || "system";

    // Delete lookup category
    await deleteLookupCategoryByIdService(id, userId);

    console.log(`✅ Controller: Deleted lookup category ${id}`);

    return sendSuccess(
      res,
      { message: "Lookup category deleted successfully" },
      "Lookup category deleted successfully"
    );
  } catch (error) {
    console.error("❌ Controller error deleting lookup category:", error);

    if (error.message.includes("not found")) {
      return sendNotFound(res, "Lookup category not found");
    }

    return sendError(
      res,
      "DELETE_FAILED",
      "Failed to delete lookup category",
      null,
      500
    );
  }
}

/**
 * Partially update a lookup category by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function patchLookupCategoryById(req, res) {
  try {
    const { id } = req.params;

    // Validate ID
    if (!isValidLookupCategoryId(id)) {
      return sendValidationError(res, "Invalid lookup category ID");
    }

    // Validate partial update data
    const validationResult = LookupCategoryUpdateSchema.partial().safeParse(
      req.body
    );
    if (!validationResult.success) {
      console.log("❌ Controller: Validation failed:", validationResult.error);
      return handleZodError(res, validationResult.error);
    }

    const validatedData = validationResult.data;
    console.log(
      `🔄 Controller: Partially updating lookup category ${id} with:`,
      validatedData
    );

    const updatedLookupCategory = await updateLookupCategoryByIdService(
      id,
      validatedData
    );

    if (!updatedLookupCategory) {
      return sendNotFound(res, `Lookup category with ID ${id} not found`);
    }

    console.log(
      "✅ Controller: Lookup category partially updated successfully"
    );

    return sendSuccess(
      res,
      updatedLookupCategory,
      "Lookup category partially updated successfully"
    );
  } catch (error) {
    console.error(
      "❌ Controller: Error partially updating lookup category:",
      error
    );

    return sendError(
      res,
      "UPDATE_FAILED",
      "Failed to partially update lookup category",
      null,
      500
    );
  }
}

/**
 * Get all lookup categories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getAllLookupCategories(req, res) {
  try {
    const result = await listLookupCategoriesService(req.query);

    console.log(
      `✅ Controller: Retrieved ${result.data.length} lookup categories`
    );

    return sendSuccess(
      res,
      result.data,
      "Lookup categories retrieved successfully",
      200,
      result.pagination
    );
  } catch (error) {
    console.error("❌ Controller error getting all lookup categories:", error);
    return sendError(
      res,
      "FETCH_FAILED",
      "Failed to get lookup categories",
      null,
      500
    );
  }
}

/**
 * Search lookup categories with enhanced query capabilities
 * GET /internal/lookup-categories/search
 */
export async function searchLookupCategoriesHandler(req, res) {
  try {
    const result = await searchLookupCategoriesService(req.query);
    return sendSuccess(
      res,
      result.data,
      "Lookup category search completed successfully",
      200,
      result.pagination
    );
  } catch (error) {
    console.error("❌ Controller error searching lookup categories:", error);
    return sendError(
      res,
      "SEARCH_FAILED",
      "Failed to search lookup categories",
      null,
      500
    );
  }
}

/**
 * Bulk operations for lookup categories
 * POST /internal/lookup-categories/bulk
 */
export async function bulkLookupCategoriesHandler(req, res) {
  try {
    const { operation, data } = req.body;

    if (!operation || !data) {
      return sendValidationError(
        res,
        "Operation and data are required for bulk operations"
      );
    }

    const result = await bulkLookupCategoriesService(operation, data);

    const statusCode = result.success ? 200 : 207; // 207 for partial success
    return sendSuccess(
      res,
      result,
      `Bulk ${operation} operation completed`,
      statusCode
    );
  } catch (error) {
    console.error("❌ Controller error in bulk operations:", error);
    return sendError(
      res,
      "BULK_FAILED",
      "Failed to execute bulk operation",
      null,
      500
    );
  }
}

/**
 * Export lookup categories data
 * GET /internal/lookup-categories/export
 */
export async function exportLookupCategoriesHandler(req, res) {
  try {
    const { format = "json" } = req.query;
    const result = await exportLookupCategoriesService(format, req.query);

    // Set appropriate headers for file download
    res.setHeader("Content-Type", result.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`
    );

    return res.send(result.data);
  } catch (error) {
    console.error("❌ Controller error exporting lookup categories:", error);
    return sendError(
      res,
      "EXPORT_FAILED",
      "Failed to export lookup categories",
      null,
      500
    );
  }
}

/**
 * Get lookup categories statistics and analytics
 * GET /internal/lookup-categories/stats
 */
export async function getLookupCategoriesStatsHandler(req, res) {
  try {
    const stats = await getLookupCategoriesStatsService();
    return sendSuccess(
      res,
      stats,
      "Lookup category statistics retrieved successfully"
    );
  } catch (error) {
    console.error("❌ Controller error getting lookup category stats:", error);
    return sendError(
      res,
      "STATS_FAILED",
      "Failed to get lookup category statistics",
      null,
      500
    );
  }
}

/**
 * Search lookup categories by category name
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function searchLookupCategories(req, res) {
  try {
    const { category } = req.query;

    if (
      !category ||
      typeof category !== "string" ||
      category.trim().length === 0
    ) {
      return sendValidationError(
        res,
        "Category parameter is required and must be a non-empty string"
      );
    }

    const lookupCategories = await getLookupCategoriesByCategoryService(
      category.trim()
    );

    console.log(
      `✅ Controller: Found ${lookupCategories.length} lookup categories for '${category}'`
    );

    return sendSuccess(
      res,
      lookupCategories,
      `Found ${lookupCategories.length} lookup categories`
    );
  } catch (error) {
    console.error("❌ Controller error searching lookup categories:", error);
    return sendError(
      res,
      "SEARCH_FAILED",
      "Failed to search lookup categories",
      null,
      500
    );
  }
}

/**
 * Check if lookup category exists
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function checkLookupCategoryExists(req, res) {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!isValidLookupCategoryId(id)) {
      return sendValidationError(res, "Invalid lookup category ID format");
    }

    const exists = await lookupCategoryExistsService(id);

    console.log(
      `✅ Controller: Checked existence of lookup category ${id}: ${exists}`
    );

    return sendSuccess(
      res,
      { exists },
      "Lookup category existence checked successfully"
    );
  } catch (error) {
    console.error(
      "❌ Controller error checking lookup category existence:",
      error
    );
    return sendError(
      res,
      "CHECK_FAILED",
      "Failed to check lookup category existence",
      null,
      500
    );
  }
}
