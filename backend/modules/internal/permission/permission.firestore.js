import { db } from "../../../services/firestore.client.js";

const COLLECTION_PATH = "touchAfrica/southAfrica/permission";

/**
 * Create a new internal permission in Firestore
 */
export const createInternalPermission = async (internalPermissionData) => {
  try {
    const docRef = db.doc(
      `${COLLECTION_PATH}/${internalPermissionData.permissionId}`
    );

    await docRef.set(internalPermissionData, { merge: true });

    return internalPermissionData;
  } catch (error) {
    console.error("Error creating internal permission:", error);
    throw new Error("Failed to create internal permission");
  }
};

/**
 * Get internal permission by ID from Firestore
 */
export const getInternalPermissionById = async (permissionId) => {
  try {
    const docRef = db.doc(`${COLLECTION_PATH}/${permissionId}`);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    return { permissionId, ...doc.data() };
  } catch (error) {
    console.error("Error getting internal permission:", error);
    throw new Error("Failed to get internal permission");
  }
};

/**
 * Update internal permission by ID in Firestore
 */
export const updateInternalPermissionById = async (
  permissionId,
  updateData
) => {
  try {
    const docRef = db.doc(`${COLLECTION_PATH}/${permissionId}`);

    // Check if document exists
    const doc = await docRef.get();
    if (!doc.exists) {
      return null;
    }

    await docRef.update(updateData);

    // Get updated document
    const updatedDoc = await docRef.get();
    return { permissionId, ...updatedDoc.data() };
  } catch (error) {
    console.error("Error updating internal permission:", error);
    throw new Error("Failed to update internal permission");
  }
};

/**
 * Delete internal permission by ID from Firestore
 */
export const deleteInternalPermissionById = async (permissionId) => {
  try {
    const docRef = db.doc(`${COLLECTION_PATH}/${permissionId}`);

    // Check if document exists
    const doc = await docRef.get();
    if (!doc.exists) {
      return false;
    }

    await docRef.delete();
    return true;
  } catch (error) {
    console.error("Error deleting internal permission:", error);
    throw new Error("Failed to delete internal permission");
  }
};

/**
 * Get all internal permissions from Firestore
 */
export const getAllInternalPermissions = async () => {
  try {
    const collectionRef = db.collection("touchAfrica/southAfrica/permission");
    const snapshot = await collectionRef.get();

    const internalPermissions = [];
    snapshot.forEach((doc) => {
      internalPermissions.push({ permissionId: doc.id, ...doc.data() });
    });

    return internalPermissions;
  } catch (error) {
    console.error("Error getting all internal permissions:", error);
    throw new Error("Failed to get internal permissions");
  }
};
