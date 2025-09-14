import { db } from "../../../../services/firestore.client.js";

const COLLECTION_PATH = "touchAfrica/southAfrica/standardRoleMappings";

/**
 * Create a new standard role mapping in Firestore
 */
export const createStandardRoleMapping = async (roleMappingData) => {
  try {
    const docRef = db.doc(`${COLLECTION_PATH}/${roleMappingData.mappingId}`);

    await docRef.set(roleMappingData, { merge: true });

    return roleMappingData;
  } catch (error) {
    console.error("Error creating standard role mapping:", error);
    throw new Error("Failed to create standard role mapping");
  }
};

/**
 * Get standard role mapping by ID from Firestore
 */
export const getStandardRoleMappingById = async (mappingId) => {
  try {
    const docRef = db.doc(`${COLLECTION_PATH}/${mappingId}`);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    return { mappingId, ...doc.data() };
  } catch (error) {
    console.error("Error getting standard role mapping:", error);
    throw new Error("Failed to get standard role mapping");
  }
};

/**
 * Get standard role mapping by role name from Firestore
 */
export const getStandardRoleMappingByName = async (roleName) => {
  try {
    const collectionRef = db.collection(COLLECTION_PATH);
    const snapshot = await collectionRef
      .where("roleName", "==", roleName)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { mappingId: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error getting standard role mapping by name:", error);
    throw new Error("Failed to get standard role mapping by name");
  }
};

/**
 * Update standard role mapping by ID in Firestore
 */
export const updateStandardRoleMappingById = async (mappingId, updateData) => {
  try {
    const docRef = db.doc(`${COLLECTION_PATH}/${mappingId}`);

    // Check if document exists
    const doc = await docRef.get();
    if (!doc.exists) {
      return null;
    }

    await docRef.update(updateData);

    // Get updated document
    const updatedDoc = await docRef.get();
    return { mappingId, ...updatedDoc.data() };
  } catch (error) {
    console.error("Error updating standard role mapping:", error);
    throw new Error("Failed to update standard role mapping");
  }
};

/**
 * Delete standard role mapping by ID from Firestore
 */
export const deleteStandardRoleMappingById = async (mappingId) => {
  try {
    const docRef = db.doc(`${COLLECTION_PATH}/${mappingId}`);

    // Check if document exists
    const doc = await docRef.get();
    if (!doc.exists) {
      return false;
    }

    await docRef.delete();
    return true;
  } catch (error) {
    console.error("Error deleting standard role mapping:", error);
    throw new Error("Failed to delete standard role mapping");
  }
};

/**
 * Get all standard role mappings from Firestore
 */
export const getAllStandardRoleMappings = async () => {
  try {
    const collectionRef = db.collection(COLLECTION_PATH);
    const snapshot = await collectionRef.orderBy("roleName").get();

    const roleMappings = [];
    snapshot.forEach((doc) => {
      roleMappings.push({ mappingId: doc.id, ...doc.data() });
    });

    return roleMappings;
  } catch (error) {
    console.error("Error getting all standard role mappings:", error);
    throw new Error("Failed to get standard role mappings");
  }
};

/**
 * Get standard role mappings with filters
 */
export const getStandardRoleMappingsWithFilters = async (filters = {}) => {
  try {
    let query = db.collection(COLLECTION_PATH);

    // Apply filters
    if (filters.roleName) {
      query = query.where("roleName", "==", filters.roleName);
    }

    if (filters.roleCode) {
      query = query.where("roleCode", "==", filters.roleCode);
    }

    if (filters.isActive !== undefined) {
      query = query.where("isActive", "==", filters.isActive);
    }

    if (filters.priority !== undefined) {
      query = query.where("priority", "==", filters.priority);
    }

    // Order results
    query = query.orderBy("roleName");

    const snapshot = await query.get();

    const roleMappings = [];
    snapshot.forEach((doc) => {
      roleMappings.push({ mappingId: doc.id, ...doc.data() });
    });

    return roleMappings;
  } catch (error) {
    console.error("Error getting filtered standard role mappings:", error);
    throw new Error("Failed to get filtered standard role mappings");
  }
};

/**
 * Check if standard role mapping exists by name
 */
export const standardRoleMappingExistsByName = async (roleName) => {
  try {
    const collectionRef = db.collection(COLLECTION_PATH);
    const snapshot = await collectionRef
      .where("roleName", "==", roleName)
      .limit(1)
      .get();

    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking standard role mapping existence:", error);
    throw new Error("Failed to check standard role mapping existence");
  }
};

/**
 * Get standard role mappings count
 */
export const getStandardRoleMappingsCount = async () => {
  try {
    const collectionRef = db.collection(COLLECTION_PATH);
    const snapshot = await collectionRef.get();
    return snapshot.size;
  } catch (error) {
    console.error("Error getting standard role mappings count:", error);
    throw new Error("Failed to get standard role mappings count");
  }
};

/**
 * Bulk delete standard role mappings
 */
export const bulkDeleteStandardRoleMappings = async (mappingIds) => {
  try {
    const batch = db.batch();

    mappingIds.forEach((mappingId) => {
      const docRef = db.doc(`${COLLECTION_PATH}/${mappingId}`);
      batch.delete(docRef);
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error bulk deleting standard role mappings:", error);
    throw new Error("Failed to bulk delete standard role mappings");
  }
};
