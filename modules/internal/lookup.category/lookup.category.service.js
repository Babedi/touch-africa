import {
  createLookupCategory,
  getLookupCategoryById,
  updateLookupCategoryById,
  deleteLookupCategoryById,
  getAllLookupCategories,
} from "./lookup.category.firestore.js";

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
