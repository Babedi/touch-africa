import {
  createLookupSubCategoryService,
  getLookupSubCategoryByIdService,
  updateLookupSubCategoryByIdService,
  deleteLookupSubCategoryByIdService,
  getAllLookupSubCategoriesService,
  getLookupSubCategoriesBySubcategoryService,
  lookupSubCategoryExistsService,
} from "./lookup.sub.category.service.js";

import {
  LookupSubCategorySchema,
  LookupSubCategoryUpdateSchema,
  isValidLookupSubCategoryId,
} from "./lookup.sub.category.validation.js";

// Define authorization roles for this module
export const readRoles = [
  "internalRootAdmin",
  "internalSuperAdmin",
  "lookupSubCategoryManager",
];

export const writeRoles = [
  "internalRootAdmin",
  "internalSuperAdmin",
  "lookupSubCategoryManager",
];

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
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationResult.error.errors,
      });
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

    res.status(201).json({
      success: true,
      data: createdLookupSubCategory,
    });
  } catch (error) {
    console.error("❌ Controller error creating lookup sub category:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create lookup sub category",
    });
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
      return res.status(400).json({
        success: false,
        error: "Invalid lookup sub category ID format",
      });
    }

    // Get lookup sub category
    const lookupSubCategory = await getLookupSubCategoryByIdService(id);

    if (!lookupSubCategory) {
      return res.status(404).json({
        success: false,
        error: "Lookup sub category not found",
      });
    }

    console.log(`✅ Controller: Retrieved lookup sub category ${id}`);

    res.status(200).json({
      success: true,
      data: lookupSubCategory,
    });
  } catch (error) {
    console.error("❌ Controller error getting lookup sub category:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get lookup sub category",
    });
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
      return res.status(400).json({
        success: false,
        error: "Invalid lookup sub category ID format",
      });
    }

    // Validate request body
    const validationResult = LookupSubCategoryUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationResult.error.errors,
      });
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

    res.status(200).json({
      success: true,
      data: updatedLookupSubCategory,
    });
  } catch (error) {
    console.error("❌ Controller error updating lookup sub category:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: "Lookup sub category not found",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update lookup sub category",
    });
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
      return res.status(400).json({
        success: false,
        error: "Invalid lookup sub category ID format",
      });
    }

    const userId = req.admin?.id || req.user?.id || req.user?.email || "system";

    // Delete lookup sub category
    await deleteLookupSubCategoryByIdService(id, userId);

    console.log(`✅ Controller: Deleted lookup sub category ${id}`);

    res.status(200).json({
      success: true,
      data: { message: "Lookup sub category deleted successfully" },
    });
  } catch (error) {
    console.error("❌ Controller error deleting lookup sub category:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: "Lookup sub category not found",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to delete lookup sub category",
    });
  }
}

/**
 * Get all lookup sub categories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getAllLookupSubCategories(req, res) {
  try {
    const lookupSubCategories = await getAllLookupSubCategoriesService();

    console.log(
      `✅ Controller: Retrieved ${lookupSubCategories.length} lookup sub categories`
    );

    res.status(200).json({
      success: true,
      data: lookupSubCategories,
    });
  } catch (error) {
    console.error(
      "❌ Controller error getting all lookup sub categories:",
      error
    );
    res.status(500).json({
      success: false,
      error: "Failed to get lookup sub categories",
    });
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
      return res.status(400).json({
        success: false,
        error:
          "Subcategory parameter is required and must be a non-empty string",
      });
    }

    const lookupSubCategories =
      await getLookupSubCategoriesBySubcategoryService(subcategory.trim());

    console.log(
      `✅ Controller: Found ${lookupSubCategories.length} lookup sub categories for '${subcategory}'`
    );

    res.status(200).json({
      success: true,
      data: lookupSubCategories,
    });
  } catch (error) {
    console.error(
      "❌ Controller error searching lookup sub categories:",
      error
    );
    res.status(500).json({
      success: false,
      error: "Failed to search lookup sub categories",
    });
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
      return res.status(400).json({
        success: false,
        error: "Invalid lookup sub category ID format",
      });
    }

    const exists = await lookupSubCategoryExistsService(id);

    console.log(
      `✅ Controller: Checked existence of lookup sub category ${id}: ${exists}`
    );

    res.status(200).json({
      success: true,
      data: { exists },
    });
  } catch (error) {
    console.error(
      "❌ Controller error checking lookup sub category existence:",
      error
    );
    res.status(500).json({
      success: false,
      error: "Failed to check lookup sub category existence",
    });
  }
}
