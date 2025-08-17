import {
  createLookupSubCategory,
  getLookupSubCategoryById,
  updateLookupSubCategoryById,
  deleteLookupSubCategoryById,
  getAllLookupSubCategories,
} from "./lookup.sub.category.firestore.js";

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
