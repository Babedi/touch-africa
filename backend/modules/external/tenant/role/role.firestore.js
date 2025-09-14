/**
 * External Role Firestore Operations
 * Handles CRUD operations for external roles in Firestore
 */

import { db } from "../../../../services/firestore.client.js";

export const COLLECTION_PATH =
  "touchAfrica/southAfrica/tenants/{tenantId}/roles";

/**
 * Create a new external role in Firestore
 * @param {Object} roleData - External role data to store
 * @param {string} customId - Optional custom document ID to use
 * @param {string} tenantId - Tenant ID for the role
 * @returns {Promise<Object>} Created external role data
 */
export async function createExternalRole(roleData, customId = null, tenantId) {
  try {
    const documentId = customId || roleData.id || roleData.roleId;
    if (!documentId) {
      throw new Error("No document ID provided for external role");
    }

    if (!tenantId) {
      throw new Error("No tenant ID provided for external role");
    }

    const collectionPath = COLLECTION_PATH.replace("{tenantId}", tenantId);
    const docRef = db.doc(`${collectionPath}/${documentId}`);
    await docRef.set(roleData, { merge: true });
    return { ...roleData, roleId: documentId };
  } catch (error) {
    console.error("Error creating external role:", error);
    throw new Error(`Failed to create external role: ${error.message}`);
  }
}

/**
 * Get an external role by ID from Firestore
 * @param {string} roleId - External role ID to retrieve
 * @param {string} tenantId - Tenant ID for the role
 * @returns {Promise<Object|null>} External role data or null if not found
 */
export async function getExternalRoleById(roleId, tenantId) {
  try {
    if (!tenantId) {
      throw new Error("No tenant ID provided for external role lookup");
    }

    const collectionPath = COLLECTION_PATH.replace("{tenantId}", tenantId);
    const docRef = db.doc(`${collectionPath}/${roleId}`);
    const doc = await docRef.get();

    if (doc.exists) {
      return { roleId: doc.id, ...doc.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting external role:", error);
    throw new Error(`Failed to get external role: ${error.message}`);
  }
}

/**
 * Update an external role by ID in Firestore
 * @param {string} roleId - External role ID to update
 * @param {Object} updateData - Data to update
 * @param {string} tenantId - Tenant ID for the role
 * @returns {Promise<Object>} Updated external role data
 */
export async function updateExternalRoleById(roleId, updateData, tenantId) {
  try {
    if (!tenantId) {
      throw new Error("No tenant ID provided for external role update");
    }

    const collectionPath = COLLECTION_PATH.replace("{tenantId}", tenantId);
    const docRef = db.doc(`${collectionPath}/${roleId}`);

    // Check if role exists first
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error("External role not found");
    }

    // Update with merge to preserve existing data
    await docRef.update(updateData);

    // Return updated role data
    const updatedDoc = await docRef.get();
    return { roleId: updatedDoc.id, ...updatedDoc.data() };
  } catch (error) {
    console.error("Error updating external role:", error);
    throw new Error(`Failed to update external role: ${error.message}`);
  }
}

/**
 * Delete an external role by ID from Firestore
 * @param {string} roleId - External role ID to delete
 * @param {string} tenantId - Tenant ID for the role
 * @returns {Promise<boolean>} Success status
 */
export async function deleteExternalRoleById(roleId, tenantId) {
  try {
    if (!tenantId) {
      throw new Error("No tenant ID provided for external role deletion");
    }

    const collectionPath = COLLECTION_PATH.replace("{tenantId}", tenantId);
    const docRef = db.doc(`${collectionPath}/${roleId}`);

    // Check if role exists first
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error("External role not found");
    }

    await docRef.delete();
    return true;
  } catch (error) {
    console.error("Error deleting external role:", error);
    throw new Error(`Failed to delete external role: ${error.message}`);
  }
}

/**
 * Get all external roles from Firestore
 * @param {string} tenantId - Tenant ID for the roles
 * @returns {Promise<Array>} Array of external role data
 */
export async function getAllExternalRoles(tenantId) {
  try {
    if (!tenantId) {
      throw new Error("No tenant ID provided for external roles lookup");
    }

    const collectionPath = COLLECTION_PATH.replace("{tenantId}", tenantId);
    const collectionRef = db.collection(collectionPath);
    const snapshot = await collectionRef.get();

    const roles = [];
    snapshot.forEach((doc) => {
      roles.push({ roleId: doc.id, ...doc.data() });
    });

    return roles;
  } catch (error) {
    console.error("Error getting all external roles:", error);
    throw new Error(`Failed to get external roles: ${error.message}`);
  }
}

/**
 * Check if a role code already exists
 * @param {string} roleCode - Role code to check
 * @param {string} excludeRoleId - Optional role ID to exclude from check (for updates)
 * @returns {Promise<boolean>} True if role code exists, false otherwise
 */
export async function roleCodeExists(roleCode, excludeRoleId = null, tenantId) {
  try {
    if (!tenantId) {
      throw new Error("No tenant ID provided for role code existence check");
    }

    const collectionPath = COLLECTION_PATH.replace("{tenantId}", tenantId);
    const collectionRef = db.collection(collectionPath);
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
