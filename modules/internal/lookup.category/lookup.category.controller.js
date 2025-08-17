import {
  createLookupCategoryService,
  getLookupCategoryByIdService,
  updateLookupCategoryByIdService,
  deleteLookupCategoryByIdService,
  getAllLookupCategoriesService,
  getLookupCategoriesByCategoryService,
  lookupCategoryExistsService,
} from "./lookup.category.service.js";

import {
  LookupCategorySchema,
  LookupCategoryUpdateSchema,
  isValidLookupCategoryId,
} from "./lookup.category.validation.js";

// Define authorization roles for this module
export const readRoles = [
  "internalRootAdmin",
  "internalSuperAdmin",
  "internalStandardAdmin",
];

export const writeRoles = ["internalRootAdmin", "internalSuperAdmin"];

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
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationResult.error.errors,
      });
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

    res.status(201).json({
      success: true,
      data: createdLookupCategory,
    });
  } catch (error) {
    console.error("❌ Controller error creating lookup category:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create lookup category",
    });
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
      return res.status(400).json({
        success: false,
        error: "Invalid lookup category ID format",
      });
    }

    // Get lookup category
    const lookupCategory = await getLookupCategoryByIdService(id);

    if (!lookupCategory) {
      return res.status(404).json({
        success: false,
        error: "Lookup category not found",
      });
    }

    console.log(`✅ Controller: Retrieved lookup category ${id}`);

    res.status(200).json({
      success: true,
      data: lookupCategory,
    });
  } catch (error) {
    console.error("❌ Controller error getting lookup category:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get lookup category",
    });
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
      return res.status(400).json({
        success: false,
        error: "Invalid lookup category ID format",
      });
    }

    // Validate request body
    const validationResult = LookupCategoryUpdateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationResult.error.errors,
      });
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

    res.status(200).json({
      success: true,
      data: updatedLookupCategory,
    });
  } catch (error) {
    console.error("❌ Controller error updating lookup category:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: "Lookup category not found",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update lookup category",
    });
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
      return res.status(400).json({
        success: false,
        error: "Invalid lookup category ID format",
      });
    }

    const userId = req.admin?.id || req.user?.id || req.user?.email || "system";

    // Delete lookup category
    await deleteLookupCategoryByIdService(id, userId);

    console.log(`✅ Controller: Deleted lookup category ${id}`);

    res.status(200).json({
      success: true,
      data: { message: "Lookup category deleted successfully" },
    });
  } catch (error) {
    console.error("❌ Controller error deleting lookup category:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: "Lookup category not found",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to delete lookup category",
    });
  }
}

/**
 * Get all lookup categories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getAllLookupCategories(req, res) {
  try {
    const lookupCategories = await getAllLookupCategoriesService();

    console.log(
      `✅ Controller: Retrieved ${lookupCategories.length} lookup categories`
    );

    res.status(200).json({
      success: true,
      data: lookupCategories,
    });
  } catch (error) {
    console.error("❌ Controller error getting all lookup categories:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get lookup categories",
    });
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
      return res.status(400).json({
        success: false,
        error: "Category parameter is required and must be a non-empty string",
      });
    }

    const lookupCategories = await getLookupCategoriesByCategoryService(
      category.trim()
    );

    console.log(
      `✅ Controller: Found ${lookupCategories.length} lookup categories for '${category}'`
    );

    res.status(200).json({
      success: true,
      data: lookupCategories,
    });
  } catch (error) {
    console.error("❌ Controller error searching lookup categories:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search lookup categories",
    });
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
      return res.status(400).json({
        success: false,
        error: "Invalid lookup category ID format",
      });
    }

    const exists = await lookupCategoryExistsService(id);

    console.log(
      `✅ Controller: Checked existence of lookup category ${id}: ${exists}`
    );

    res.status(200).json({
      success: true,
      data: { exists },
    });
  } catch (error) {
    console.error(
      "❌ Controller error checking lookup category existence:",
      error
    );
    res.status(500).json({
      success: false,
      error: "Failed to check lookup category existence",
    });
  }
}
