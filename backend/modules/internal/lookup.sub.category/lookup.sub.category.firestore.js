import { db } from "../../../services/firestore.client.js";
import { newLookupSubCategoryId } from "./lookup.sub.category.validation.js";

const COLLECTION_PATH = "touchAfrica/southAfrica/lookupSubCategory";

/**
 * Create a new lookup sub category
 * @param {Object} lookupSubCategoryData - The lookup sub category data
 * @returns {Promise<Object>} Created lookup sub category with ID
 */
export async function createLookupSubCategory(lookupSubCategoryData) {
  try {
    const id = newLookupSubCategoryId();
    const docRef = db.collection(COLLECTION_PATH).doc(id);

    const lookupSubCategoryWithId = {
      id,
      ...lookupSubCategoryData,
    };

    await docRef.set(lookupSubCategoryWithId, { merge: true });

    console.log(`✅ Lookup sub category created with ID: ${id}`);
    return lookupSubCategoryWithId;
  } catch (error) {
    console.error("❌ Error creating lookup sub category:", error);
    throw new Error(`Failed to create lookup sub category: ${error.message}`);
  }
}

/**
 * Get lookup sub category by ID
 * @param {string} id - The lookup sub category ID
 * @returns {Promise<Object|null>} Lookup sub category data or null if not found
 */
export async function getLookupSubCategoryById(id) {
  try {
    const docRef = db.collection(COLLECTION_PATH).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log(`⚠️ Lookup sub category not found: ${id}`);
      return null;
    }

    const data = doc.data();
    console.log(`✅ Lookup sub category retrieved: ${id}`);
    return data;
  } catch (error) {
    console.error("❌ Error getting lookup sub category:", error);
    throw new Error(`Failed to get lookup sub category: ${error.message}`);
  }
}

/**
 * Update lookup sub category by ID
 * @param {string} id - The lookup sub category ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object>} Updated lookup sub category
 */
export async function updateLookupSubCategoryById(id, updateData) {
  try {
    const docRef = db.collection(COLLECTION_PATH).doc(id);

    // Check if document exists
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error(`Lookup sub category not found: ${id}`);
    }

    // Update the document
    await docRef.update(updateData);

    // Get updated document
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data();

    console.log(`✅ Lookup sub category updated: ${id}`);
    return updatedData;
  } catch (error) {
    console.error("❌ Error updating lookup sub category:", error);
    throw new Error(`Failed to update lookup sub category: ${error.message}`);
  }
}

/**
 * Delete lookup sub category by ID
 * @param {string} id - The lookup sub category ID
 * @returns {Promise<void>}
 */
export async function deleteLookupSubCategoryById(id) {
  try {
    const docRef = db.collection(COLLECTION_PATH).doc(id);

    // Check if document exists
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error(`Lookup sub category not found: ${id}`);
    }

    await docRef.delete();
    console.log(`✅ Lookup sub category deleted: ${id}`);
  } catch (error) {
    console.error("❌ Error deleting lookup sub category:", error);
    throw new Error(`Failed to delete lookup sub category: ${error.message}`);
  }
}

/**
 * Get all lookup sub categories
 * @returns {Promise<Array>} Array of all lookup sub categories
 */
export async function getAllLookupSubCategories() {
  try {
    const snapshot = await db.collection(COLLECTION_PATH).get();

    const lookupSubCategories = [];
    snapshot.forEach((doc) => {
      lookupSubCategories.push(doc.data());
    });

    console.log(
      `✅ Retrieved ${lookupSubCategories.length} lookup sub categories`
    );
    return lookupSubCategories;
  } catch (error) {
    console.error("❌ Error getting all lookup sub categories:", error);
    throw new Error(`Failed to get lookup sub categories: ${error.message}`);
  }
}
