import { db } from "../../../services/firestore.client.js";

const COLLECTION_PATH = "touchAfrica/southAfrica/lookups";

/**
 * Create a new lookup
 * @param {Object} lookupData - The lookup data to create
 * @returns {Promise<string>} - The ID of the created lookup
 */
export async function createLookup(lookupData) {
  try {
    const lookupRef = db.collection(COLLECTION_PATH).doc(lookupData.id);
    await lookupRef.set(lookupData, { merge: true });
    return lookupData.id;
  } catch (error) {
    console.error("Error creating lookup:", error);
    throw new Error("Failed to create lookup");
  }
}

/**
 * Get a lookup by ID
 * @param {string} id - The lookup ID
 * @returns {Promise<Object|null>} - The lookup data or null if not found
 */
export async function getLookupById(id) {
  try {
    const lookupRef = db.collection(COLLECTION_PATH).doc(id);
    const doc = await lookupRef.get();

    if (!doc.exists) {
      return null;
    }

    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error getting lookup by ID:", error);
    throw new Error("Failed to get lookup");
  }
}

/**
 * Update a lookup by ID
 * @param {string} id - The lookup ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<boolean>} - Success status
 */
export async function updateLookupById(id, updateData) {
  try {
    const lookupRef = db.collection(COLLECTION_PATH).doc(id);
    await lookupRef.update(updateData);
    return true;
  } catch (error) {
    console.error("Error updating lookup:", error);
    throw new Error("Failed to update lookup");
  }
}

/**
 * Delete a lookup by ID
 * @param {string} id - The lookup ID
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteLookupById(id) {
  try {
    const lookupRef = db.collection(COLLECTION_PATH).doc(id);
    await lookupRef.delete();
    return true;
  } catch (error) {
    console.error("Error deleting lookup:", error);
    throw new Error("Failed to delete lookup");
  }
}

/**
 * Get all lookups
 * @returns {Promise<Array>} - Array of all lookups
 */
export async function getAllLookups() {
  try {
    const snapshot = await db.collection(COLLECTION_PATH).get();
    const lookups = [];

    snapshot.forEach((doc) => {
      lookups.push({ id: doc.id, ...doc.data() });
    });

    return lookups;
  } catch (error) {
    console.error("Error getting all lookups:", error);
    throw new Error("Failed to get lookups");
  }
}
