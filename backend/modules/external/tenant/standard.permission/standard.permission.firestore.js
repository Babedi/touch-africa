import { db } from "../../../../services/firestore.client.js";

const COLLECTION_PATH = "touchAfrica/southAfrica/standardPermissions";

/**
 * Create a new standard permission in Firestore
 */
export const createStandardPermission = async (standardPermissionData) => {
  try {
    const docRef = db.doc(
      `${COLLECTION_PATH}/${standardPermissionData.permissionId}`
    );

    await docRef.set(standardPermissionData, { merge: true });

    return standardPermissionData;
  } catch (error) {
    console.error("Error creating standard permission:", error);
    throw new Error("Failed to create standard permission");
  }
};

/**
 * Get standard permission by ID from Firestore
 */
export const getStandardPermissionById = async (permissionId) => {
  try {
    const docRef = db.doc(`${COLLECTION_PATH}/${permissionId}`);
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

/**
 * Update standard permission by ID in Firestore
 */
export const updateStandardPermissionById = async (
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
    console.error("Error updating standard permission:", error);
    throw new Error("Failed to update standard permission");
  }
};

/**
 * Delete standard permission by ID from Firestore
 */
export const deleteStandardPermissionById = async (permissionId) => {
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
    console.error("Error deleting standard permission:", error);
    throw new Error("Failed to delete standard permission");
  }
};

/**
 * Get all standard permissions from global collection (no tenant ID required)
 */
export const getAllStandardPermissions = async () => {
  try {
    // Use the global standard permissions collection path directly
    const collectionRef = db.collection(COLLECTION_PATH);
    const snapshot = await collectionRef.get();

    const standardPermissions = [];
    snapshot.forEach((doc) => {
      standardPermissions.push({ permissionId: doc.id, ...doc.data() });
    });

    return standardPermissions;
  } catch (error) {
    console.error("Error getting all standard permissions:", error);
    throw new Error("Failed to get standard permissions");
  }
};
