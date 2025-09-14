import { db } from "../../../../services/firestore.client.js";

// Multi-tenant path: /touchAfrica/southAfrica/tenants/{TENANT_ID}/admins/{ADMIN_ID}
// Tenant ID will be provided dynamically from frontend routes

/**
 * Get collection path for a specific tenant
 * @param {string} tenantId - The tenant ID
 * @returns {string} Collection path
 */
export const getAdminCollectionPath = (tenantId) => {
  if (!tenantId) {
    throw new Error("Tenant ID is required for admin operations");
  }
  return `touchAfrica/southAfrica/tenants/${tenantId}/admins`;
};

// Create External admin
export const createExternalAdmin = async (adminData, tenantId) => {
  const collectionPath = getAdminCollectionPath(tenantId);
  const docRef = db.doc(`${collectionPath}/${adminData.id}`);
  await docRef.set(adminData);
  return adminData;
};

// Get External admin by ID
export const getExternalAdminById = async (id, tenantId) => {
  const collectionPath = getAdminCollectionPath(tenantId);
  const docRef = db.doc(`${collectionPath}/${id}`);
  const doc = await docRef.get();

  if (!doc.exists) {
    return null;
  }

  return doc.data();
};

// Update External admin by ID
export const updateExternalAdminById = async (id, updateData, tenantId) => {
  const collectionPath = getAdminCollectionPath(tenantId);
  const docRef = db.doc(`${collectionPath}/${id}`);
  await docRef.set(updateData, { merge: true });
  return updateData;
};

// Delete External admin by ID
export const deleteExternalAdminById = async (id, tenantId) => {
  const collectionPath = getAdminCollectionPath(tenantId);
  const docRef = db.doc(`${collectionPath}/${id}`);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error("Admin not found");
  }

  await docRef.delete();
  return true;
};

// Activate External admin by ID
export const activateExternalAdminById = async (id, change, tenantId) => {
  const collectionPath = getAdminCollectionPath(tenantId);
  const docRef = db.doc(`${collectionPath}/${id}`);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error("Admin not found");
  }

  const admin = doc.data();
  admin.account.isActive.value = true;
  admin.account.isActive.changes.push(change);

  await docRef.set(admin);
  return admin;
};

// Deactivate External admin by ID
export const deactivateExternalAdminById = async (id, change, tenantId) => {
  const collectionPath = getAdminCollectionPath(tenantId);
  const docRef = db.doc(`${collectionPath}/${id}`);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error("Admin not found");
  }

  const admin = doc.data();
  admin.account.isActive.value = false;
  admin.account.isActive.changes.push(change);

  await docRef.set(admin);
  return admin;
};

// Get all External admins
export const getAllExternalAdmins = async (tenantId) => {
  const collectionPath = getAdminCollectionPath(tenantId);
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map((doc) => doc.data());
};

// Get External admin by email (for login)
export const getExternalAdminByEmail = async (email, tenantId) => {
  const collectionPath = getAdminCollectionPath(tenantId);
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef
    .where("accessDetails.email", "==", email)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data();
};
