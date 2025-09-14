/**
 * Standard Role Firestore Operations
 * Handles CRUD operations for standard roles in Firestore
 */

import { db } from "../../../../services/firestore.client.js";

export const COLLECTION_PATH = "touchAfrica/southAfrica/standardRoles";

/**
 * Create a new standard role in Firestore
 * @param {Object} roleData - Standard role data to store
 * @param {string} customId - Optional custom document ID to use
 * @returns {Promise<Object>} Created standard role data
 */
export async function createStandardRole(roleData, customId = null) {
  try {
    const documentId = customId || roleData.id || roleData.roleId;
    if (!documentId) {
      throw new Error("No document ID provided for standard role");
    }

    const docRef = db.doc(`${COLLECTION_PATH}/${documentId}`);
    await docRef.set(roleData, { merge: true });
    return { ...roleData, roleId: documentId };
  } catch (error) {
    console.error("Error creating standard role:", error);
    throw new Error(`Failed to create standard role: ${error.message}`);
  }
}

/**
 * Get a standard role by ID from Firestore
 * @param {string} roleId - Standard role ID to retrieve
 * @returns {Promise<Object|null>} Standard role data or null if not found
 */
export async function getStandardRoleById(roleId) {
  try {
    const docRef = db.doc(`${COLLECTION_PATH}/${roleId}`);
    const doc = await docRef.get();

    if (doc.exists) {
      return { roleId: doc.id, ...doc.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting standard role:", error);
    throw new Error(`Failed to get standard role: ${error.message}`);
  }
}

/**
 * Update a standard role by ID in Firestore
 * @param {string} roleId - Standard role ID to update
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated standard role data
 */
export async function updateStandardRoleById(roleId, updateData) {
  try {
    const docRef = db.doc(`${COLLECTION_PATH}/${roleId}`);

    // Check if role exists first
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error("Standard role not found");
    }

    // Update with merge to preserve existing data
    await docRef.update(updateData);

    // Return updated role data
    const updatedDoc = await docRef.get();
    return { roleId: updatedDoc.id, ...updatedDoc.data() };
  } catch (error) {
    console.error("Error updating standard role:", error);
    throw new Error(`Failed to update standard role: ${error.message}`);
  }
}

/**
 * Delete a standard role by ID from Firestore
 * @param {string} roleId - Standard role ID to delete
 * @returns {Promise<boolean>} Success status
 */
export async function deleteStandardRoleById(roleId) {
  try {
    const docRef = db.doc(`${COLLECTION_PATH}/${roleId}`);

    // Check if role exists first
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error("Standard role not found");
    }

    await docRef.delete();
    return true;
  } catch (error) {
    console.error("Error deleting standard role:", error);
    throw new Error(`Failed to delete standard role: ${error.message}`);
  }
}

/**
 * Get all standard roles from Firestore
 * @returns {Promise<Array>} Array of standard role data
 */
export async function getAllStandardRoles() {
  try {
    const collectionRef = db.collection(COLLECTION_PATH);
    const snapshot = await collectionRef.get();

    const roles = [];
    snapshot.forEach((doc) => {
      roles.push({ roleId: doc.id, ...doc.data() });
    });

    return roles;
  } catch (error) {
    console.error("Error getting all standard roles:", error);
    throw new Error(`Failed to get standard roles: ${error.message}`);
  }
}

/**
 * Check if a role code already exists
 * @param {string} roleCode - Role code to check
 * @param {string} excludeRoleId - Optional role ID to exclude from check (for updates)
 * @returns {Promise<boolean>} True if role code exists, false otherwise
 */
export async function roleCodeExists(roleCode, excludeRoleId = null) {
  try {
    const collectionRef = db.collection(COLLECTION_PATH);
    const snapshot = await collectionRef
      .where("roleCode", "==", roleCode)
      .get();

    if (snapshot.empty) {
      return false;
    }

    // If excluding a specific role ID (for updates), check if any other role has this code
    if (excludeRoleId) {
      return snapshot.docs.some((doc) => doc.id !== excludeRoleId);
    }

    return true;
  } catch (error) {
    console.error("Error checking role code existence:", error);
    throw new Error(`Failed to check role code existence: ${error.message}`);
  }
}
