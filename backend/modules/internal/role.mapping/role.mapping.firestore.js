import { db } from "../../../services/firestore.client.js";

const COLLECTION_PATH = "touchAfrica/southAfrica/roleMappings";

/**
 * Create a new role mapping in Firestore
 */
export const createRoleMapping = async (roleMappingData) => {
  try {
    const docRef = db.doc(`${COLLECTION_PATH}/${roleMappingData.mappingId}`);

    await docRef.set(roleMappingData, { merge: true });

    return roleMappingData;
  } catch (error) {
    console.error("Error creating role mapping:", error);
    throw new Error("Failed to create role mapping");
  }
};

/**
 * Get role mapping by ID from Firestore
 */
export const getRoleMappingById = async (mappingId) => {
  try {
    const docRef = db.doc(`${COLLECTION_PATH}/${mappingId}`);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    return { mappingId, ...doc.data() };
  } catch (error) {
    console.error("Error getting role mapping:", error);
    throw new Error("Failed to get role mapping");
  }
};

/**
 * Get role mapping by role name from Firestore
 */
export const getRoleMappingByName = async (roleName) => {
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
    console.error("Error getting role mapping by name:", error);
    throw new Error("Failed to get role mapping by name");
  }
};

/**
 * Update role mapping by ID in Firestore
 */
export const updateRoleMappingById = async (mappingId, updateData) => {
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
    console.error("Error updating role mapping:", error);
    throw new Error("Failed to update role mapping");
  }
};

/**
 * Delete role mapping by ID from Firestore
 */
export const deleteRoleMappingById = async (mappingId) => {
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
    console.error("Error deleting role mapping:", error);
    throw new Error("Failed to delete role mapping");
  }
};

/**
 * Get all role mappings from Firestore
 */
export const getAllRoleMappings = async () => {
  try {
    const collectionRef = db.collection(COLLECTION_PATH);
    const snapshot = await collectionRef.orderBy("roleName").get();

    const roleMappings = [];
    snapshot.forEach((doc) => {
      roleMappings.push({ mappingId: doc.id, ...doc.data() });
    });

    return roleMappings;
  } catch (error) {
    console.error("Error getting all role mappings:", error);
    throw new Error("Failed to get role mappings");
  }
};

/**
 * Get role mappings with filters
 */
export const getRoleMappingsWithFilters = async (filters = {}) => {
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
    console.error("Error getting filtered role mappings:", error);
    throw new Error("Failed to get filtered role mappings");
  }
};

/**
 * Check if role mapping exists by name
 */
export const roleMappingExistsByName = async (roleName) => {
  try {
    const collectionRef = db.collection(COLLECTION_PATH);
    const snapshot = await collectionRef
      .where("roleName", "==", roleName)
      .limit(1)
      .get();

    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking role mapping existence:", error);
    throw new Error("Failed to check role mapping existence");
  }
};

/**
 * Get role mappings count
 */
export const getRoleMappingsCount = async () => {
  try {
    const collectionRef = db.collection(COLLECTION_PATH);
    const snapshot = await collectionRef.get();
    return snapshot.size;
  } catch (error) {
    console.error("Error getting role mappings count:", error);
    throw new Error("Failed to get role mappings count");
  }
};

/**
 * Bulk delete role mappings
 */
export const bulkDeleteRoleMappings = async (mappingIds) => {
  try {
    const batch = db.batch();

    mappingIds.forEach((mappingId) => {
      const docRef = db.doc(`${COLLECTION_PATH}/${mappingId}`);
      batch.delete(docRef);
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error bulk deleting role mappings:", error);
    throw new Error("Failed to bulk delete role mappings");
  }
};
