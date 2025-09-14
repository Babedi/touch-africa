import {
  createLookupSubCategoryService,
  getLookupSubCategoryByIdService,
  updateLookupSubCategoryByIdService,
  deleteLookupSubCategoryByIdService,
  getAllLookupSubCategoriesService,
  getLookupSubCategoriesBySubcategoryService,
  lookupSubCategoryExistsService,
  listLookupSubCategoriesService,
  searchLookupSubCategoriesService,
  bulkLookupSubCategoriesService,
  exportLookupSubCategoriesService,
  getLookupSubCategoriesStatsService,
} from "./lookup.sub.category.service.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../middleware/permission.middleware.js";
import {
  LookupSubCategorySchema,
  LookupSubCategoryUpdateSchema,
  isValidLookupSubCategoryId,
} from "./lookup.sub.category.validation.js";
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
 * Create a new lookup sub category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function createLookupSubCategory(req, res) {
  try {
    // Validate request body
    const validationResult = LookupSubCategorySchema.safeParse(req.body);
    if (!validationResult.success) {
      return handleZodError(res, validationResult.error);
    }

    const lookupSubCategoryData = validationResult.data;
    const userId = req.admin?.id || req.user?.id || req.user?.email || "system";

    // Create lookup sub category
    const createdLookupSubCategory = await createLookupSubCategoryService(
      lookupSubCategoryData,
      userId
    );

    console.log(
      `✅ Controller: Created lookup sub category ${createdLookupSubCategory.id}`
    );

    return sendSuccess(
      res,
      createdLookupSubCategory,
      "Lookup sub category created successfully",
      201
    );
  } catch (error) {
    console.error("❌ Controller error creating lookup sub category:", error);
    return sendError(
      res,
      "INTERNAL_ERROR",
      "Failed to create lookup sub category"
    );
  }
}

/**
 * Get lookup sub category by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getLookupSubCategoryById(req, res) {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!isValidLookupSubCategoryId(id)) {
      return sendValidationError(res, "Invalid lookup sub category ID format");
    }

    // Get lookup sub category
    const lookupSubCategory = await getLookupSubCategoryByIdService(id);

    if (!lookupSubCategory) {
      return sendNotFound(res, "Lookup sub category not found");
    }

    console.log(`✅ Controller: Retrieved lookup sub category ${id}`);

    return sendSuccess(
      res,
      lookupSubCategory,
      "Lookup sub category retrieved successfully"
    );
  } catch (error) {
    console.error("❌ Controller error getting lookup sub category:", error);
    return sendError(
      res,
      "INTERNAL_ERROR",
      "Failed to get lookup sub category"
    );
  }
}

/**
 * Update lookup sub category by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function updateLookupSubCategoryById(req, res) {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!isValidLookupSubCategoryId(id)) {
      return sendValidationError(res, "Invalid lookup sub category ID format");
    }

    // Validate request body
    const validationResult = LookupSubCategoryUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return handleZodError(res, validationResult.error);
    }

    const updateData = validationResult.data;
    const userId = req.admin?.id || req.user?.id || req.user?.email || "system";

    // Update lookup sub category
    const updatedLookupSubCategory = await updateLookupSubCategoryByIdService(
      id,
      updateData,
      userId
    );

    console.log(`✅ Controller: Updated lookup sub category ${id}`);

    return sendSuccess(
      res,
      updatedLookupSubCategory,
      "Lookup sub category updated successfully"
    );
  } catch (error) {
    console.error("❌ Controller error updating lookup sub category:", error);

    if (error.message.includes("not found")) {
      return sendNotFound(res, "Lookup sub category not found");
    }

    return sendError(
      res,
      "INTERNAL_ERROR",
      "Failed to update lookup sub category"
    );
  }
}

/**
 * Delete lookup sub category by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function deleteLookupSubCategoryById(req, res) {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!isValidLookupSubCategoryId(id)) {
      return sendValidationError(res, "Invalid lookup sub category ID format");
    }

    const userId = req.admin?.id || req.user?.id || req.user?.email || "system";

    // Delete lookup sub category
    await deleteLookupSubCategoryByIdService(id, userId);

    console.log(`✅ Controller: Deleted lookup sub category ${id}`);

    return sendSuccess(
      res,
      { message: "Lookup sub category deleted successfully" },
      "Lookup sub category deleted successfully"
    );
  } catch (error) {
    console.error("❌ Controller error deleting lookup sub category:", error);

    if (error.message.includes("not found")) {
      return sendNotFound(res, "Lookup sub category not found");
    }

    return sendError(
      res,
      "INTERNAL_ERROR",
      "Failed to delete lookup sub category"
    );
  }
}

/**
 * Partially update a lookup sub category by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function patchLookupSubCategoryById(req, res) {
  try {
    const { id } = req.params;

    // Validate ID
    if (!isValidLookupSubCategoryId(id)) {
      return sendValidationError(res, "Invalid lookup sub category ID");
    }

    // Validate partial update data
    const validationResult = LookupSubCategoryUpdateSchema.partial().safeParse(
      req.body
    );
    if (!validationResult.success) {
      console.log("❌ Controller: Validation failed:", validationResult.error);
      return handleZodError(res, validationResult.error);
    }

    const validatedData = validationResult.data;
    console.log(
      `🔄 Controller: Partially updating lookup sub category ${id} with:`,
      validatedData
    );

    const updatedLookupSubCategory = await updateLookupSubCategoryByIdService(
      id,
      validatedData
    );

    if (!updatedLookupSubCategory) {
      return sendNotFound(res, `Lookup sub category with ID ${id} not found`);
    }

    console.log(
      "✅ Controller: Lookup sub category partially updated successfully"
    );

    return sendSuccess(
      res,
      updatedLookupSubCategory,
      "Lookup sub category partially updated successfully"
    );
  } catch (error) {
    console.error(
      "❌ Controller: Error partially updating lookup sub category:",
      error
    );

    return sendError(
      res,
      "UPDATE_FAILED",
      "Failed to partially update lookup sub category",
      null,
      500
    );
  }
}

/**
 * Get all lookup sub categories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getAllLookupSubCategories(req, res) {
  try {
    const result = await listLookupSubCategoriesService(req.query);

    console.log(
      `✅ Controller: Retrieved ${result.data.length} lookup sub categories`
    );

    return sendSuccess(
      res,
      result.data,
      "Lookup sub categories retrieved successfully",
      200,
      result.pagination
    );
  } catch (error) {
    console.error(
      "❌ Controller error getting all lookup sub categories:",
      error
    );
    return sendError(
      res,
      "INTERNAL_ERROR",
      "Failed to get lookup sub categories"
    );
  }
}

/**
 * Search lookup sub categories with enhanced query capabilities
 * GET /internal/lookup-sub-categories/search
 */
export async function searchLookupSubCategoriesHandler(req, res) {
  try {
    const result = await searchLookupSubCategoriesService(req.query);
    return sendSuccess(
      res,
      result.data,
      "Lookup sub category search completed successfully",
      200,
      result.pagination
    );
  } catch (error) {
    console.error(
      "❌ Controller error searching lookup sub categories:",
      error
    );
    return sendError(
      res,
      "SEARCH_FAILED",
      "Failed to search lookup sub categories",
      null,
      500
    );
  }
}

/**
 * Bulk operations for lookup sub categories
 * POST /internal/lookup-sub-categories/bulk
 */
export async function bulkLookupSubCategoriesHandler(req, res) {
  try {
    const { operation, data } = req.body;

    if (!operation || !data) {
      return sendValidationError(
        res,
        "Operation and data are required for bulk operations"
      );
    }

    const result = await bulkLookupSubCategoriesService(operation, data);

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
 * Export lookup sub categories data
 * GET /internal/lookup-sub-categories/export
 */
export async function exportLookupSubCategoriesHandler(req, res) {
  try {
    const { format = "json" } = req.query;
    const result = await exportLookupSubCategoriesService(format, req.query);

    // Set appropriate headers for file download
    res.setHeader("Content-Type", result.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`
    );

    return res.send(result.data);
  } catch (error) {
    console.error(
      "❌ Controller error exporting lookup sub categories:",
      error
    );
    return sendError(
      res,
      "EXPORT_FAILED",
      "Failed to export lookup sub categories",
      null,
      500
    );
  }
}

/**
 * Get lookup sub categories statistics and analytics
 * GET /internal/lookup-sub-categories/stats
 */
export async function getLookupSubCategoriesStatsHandler(req, res) {
  try {
    const stats = await getLookupSubCategoriesStatsService();
    return sendSuccess(
      res,
      stats,
      "Lookup sub category statistics retrieved successfully"
    );
  } catch (error) {
    console.error(
      "❌ Controller error getting lookup sub category stats:",
      error
    );
    return sendError(
      res,
      "STATS_FAILED",
      "Failed to get lookup sub category statistics",
      null,
      500
    );
  }
}

/**
 * Search lookup sub categories by subcategory name
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function searchLookupSubCategories(req, res) {
  try {
    const { subcategory } = req.query;

    if (
      !subcategory ||
      typeof subcategory !== "string" ||
      subcategory.trim().length === 0
    ) {
      return sendValidationError(
        res,
        "Subcategory parameter is required and must be a non-empty string"
      );
    }

    const lookupSubCategories =
      await getLookupSubCategoriesBySubcategoryService(subcategory.trim());

    console.log(
      `✅ Controller: Found ${lookupSubCategories.length} lookup sub categories for '${subcategory}'`
    );

    return sendSuccess(
      res,
      lookupSubCategories,
      "Lookup sub categories found successfully"
    );
  } catch (error) {
    console.error(
      "❌ Controller error searching lookup sub categories:",
      error
    );
    return sendError(
      res,
      "INTERNAL_ERROR",
      "Failed to search lookup sub categories"
    );
  }
}

/**
 * Check if lookup sub category exists
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function checkLookupSubCategoryExists(req, res) {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!isValidLookupSubCategoryId(id)) {
      return sendValidationError(res, "Invalid lookup sub category ID format");
    }

    const exists = await lookupSubCategoryExistsService(id);

    console.log(
      `✅ Controller: Checked existence of lookup sub category ${id}: ${exists}`
    );

    return sendSuccess(
      res,
      { exists },
      "Lookup sub category existence checked successfully"
    );
  } catch (error) {
    console.error(
      "❌ Controller error checking lookup sub category existence:",
      error
    );
    return sendError(
      res,
      "INTERNAL_ERROR",
      "Failed to check lookup sub category existence"
    );
  }
}
