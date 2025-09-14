import { db } from "../../../../services/firestore.client.js";

const COLLECTION_PATH =
  "touchAfrica/southAfrica/tenants/{tenantId}/permissions";

/**
 * Create a new external permission in Firestore
 */
export const createExternalPermission = async (
  externalPermissionData,
  tenantId
) => {
  try {
    if (!tenantId) {
      throw new Error("No tenant ID provided for permission creation");
    }

    const collectionPath = COLLECTION_PATH.replace("{tenantId}", tenantId);
    const docRef = db.doc(
      `${collectionPath}/${externalPermissionData.permissionId}`
    );

    await docRef.set(externalPermissionData, { merge: true });

    return externalPermissionData;
  } catch (error) {
    console.error("Error creating external permission:", error);
    throw new Error("Failed to create external permission");
  }
};

/**
 * Get external permission by ID from Firestore
 */
export const getExternalPermissionById = async (permissionId, tenantId) => {
  try {
    if (!tenantId) {
      throw new Error("No tenant ID provided for permission lookup");
    }

    const collectionPath = COLLECTION_PATH.replace("{tenantId}", tenantId);
    const docRef = db.doc(`${collectionPath}/${permissionId}`);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    return { permissionId, ...doc.data() };
  } catch (error) {
    console.error("Error getting external permission:", error);
    throw new Error("Failed to get external permission");
  }
};

/**
 * Update external permission by ID in Firestore
 */
export const updateExternalPermissionById = async (
  permissionId,
  tenantId,
  updateData
) => {
  try {
    if (!tenantId) {
      throw new Error("No tenant ID provided for permission update");
    }

    const collectionPath = COLLECTION_PATH.replace("{tenantId}", tenantId);
    const docRef = db.doc(`${collectionPath}/${permissionId}`);

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
    console.error("Error updating external permission:", error);
    throw new Error("Failed to update external permission");
  }
};

/**
 * Delete external permission by ID from Firestore
 */
export const deleteExternalPermissionById = async (permissionId, tenantId) => {
  try {
    if (!tenantId) {
      throw new Error("No tenant ID provided for permission deletion");
    }

    const collectionPath = COLLECTION_PATH.replace("{tenantId}", tenantId);
    const docRef = db.doc(`${collectionPath}/${permissionId}`);

    // Check if document exists
    const doc = await docRef.get();
    if (!doc.exists) {
      return false;
    }

    await docRef.delete();
    return true;
  } catch (error) {
    console.error("Error deleting external permission:", error);
    throw new Error("Failed to delete external permission");
  }
};

/**
 * Get all external permissions from Firestore
 */
export const getAllExternalPermissions = async (tenantId) => {
  try {
    if (!tenantId) {
      throw new Error("No tenant ID provided for permissions lookup");
    }

    const collectionPath = COLLECTION_PATH.replace("{tenantId}", tenantId);
    const collectionRef = db.collection(collectionPath);
    const snapshot = await collectionRef.get();

    const externalPermissions = [];
    snapshot.forEach((doc) => {
      externalPermissions.push({ permissionId: doc.id, ...doc.data() });
    });

    return externalPermissions;
  } catch (error) {
    console.error("Error getting all external permissions:", error);
    throw new Error("Failed to get external permissions");
  }
};
