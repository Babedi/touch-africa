import { db } from "../../../services/firestore.client.js";
import { newLookupCategoryId } from "./lookup.category.validation.js";

const COLLECTION_PATH = "touchAfrica/southAfrica/lookupCategory";

/**
 * Create a new lookup category
 * @param {Object} lookupCategoryData - The lookup category data
 * @returns {Promise<Object>} Created lookup category with ID
 */
export async function createLookupCategory(lookupCategoryData) {
  try {
    const id = newLookupCategoryId();
    const docRef = db.collection(COLLECTION_PATH).doc(id);

    const lookupCategoryWithId = {
      id,
      ...lookupCategoryData,
    };

    await docRef.set(lookupCategoryWithId, { merge: true });

    console.log(`✅ Lookup category created with ID: ${id}`);
    return lookupCategoryWithId;
  } catch (error) {
    console.error("❌ Error creating lookup category:", error);
    throw new Error(`Failed to create lookup category: ${error.message}`);
  }
}

/**
 * Get lookup category by ID
 * @param {string} id - The lookup category ID
 * @returns {Promise<Object|null>} Lookup category data or null if not found
 */
export async function getLookupCategoryById(id) {
  try {
    const docRef = db.collection(COLLECTION_PATH).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log(`⚠️ Lookup category not found: ${id}`);
      return null;
    }

    const data = doc.data();
    console.log(`✅ Lookup category retrieved: ${id}`);
    return data;
  } catch (error) {
    console.error("❌ Error getting lookup category:", error);
    throw new Error(`Failed to get lookup category: ${error.message}`);
  }
}

/**
 * Update lookup category by ID
 * @param {string} id - The lookup category ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object>} Updated lookup category
 */
export async function updateLookupCategoryById(id, updateData) {
  try {
    const docRef = db.collection(COLLECTION_PATH).doc(id);

    // Check if document exists
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error(`Lookup category not found: ${id}`);
    }

    // Update the document
    await docRef.update(updateData);

    // Get updated document
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data();

    console.log(`✅ Lookup category updated: ${id}`);
    return updatedData;
  } catch (error) {
    console.error("❌ Error updating lookup category:", error);
    throw new Error(`Failed to update lookup category: ${error.message}`);
  }
}

/**
 * Delete lookup category by ID
 * @param {string} id - The lookup category ID
 * @returns {Promise<void>}
 */
export async function deleteLookupCategoryById(id) {
  try {
    const docRef = db.collection(COLLECTION_PATH).doc(id);

    // Check if document exists
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error(`Lookup category not found: ${id}`);
    }

    await docRef.delete();
    console.log(`✅ Lookup category deleted: ${id}`);
  } catch (error) {
    console.error("❌ Error deleting lookup category:", error);
    throw new Error(`Failed to delete lookup category: ${error.message}`);
  }
}

/**
 * Get all lookup categories
 * @returns {Promise<Array>} Array of all lookup categories
 */
export async function getAllLookupCategories() {
  try {
    const snapshot = await db.collection(COLLECTION_PATH).get();

    const lookupCategories = [];
    snapshot.forEach((doc) => {
      lookupCategories.push(doc.data());
    });

    console.log(`✅ Retrieved ${lookupCategories.length} lookup categories`);
    return lookupCategories;
  } catch (error) {
    console.error("❌ Error getting all lookup categories:", error);
    throw new Error(`Failed to get lookup categories: ${error.message}`);
  }
}
