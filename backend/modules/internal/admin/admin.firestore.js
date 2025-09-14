import { db } from "../../../services/firestore.client.js";

const COLLECTION_PATH = "touchAfrica/southAfrica/admins";

// Create internal admin
export const createInternalAdmin = async (adminData) => {
  const docRef = db.doc(`${COLLECTION_PATH}/${adminData.id}`);
  await docRef.set(adminData);
  return adminData;
};

// Get internal admin by ID
export const getInternalAdminById = async (id) => {
  const docRef = db.doc(`${COLLECTION_PATH}/${id}`);
  const doc = await docRef.get();

  if (!doc.exists) {
    return null;
  }

  return doc.data();
};

// Update internal admin by ID
export const updateInternalAdminById = async (id, updateData) => {
  const docRef = db.doc(`${COLLECTION_PATH}/${id}`);
  await docRef.set(updateData, { merge: true });
  return updateData;
};

// Delete internal admin by ID
export const deleteInternalAdminById = async (id) => {
  const docRef = db.doc(`${COLLECTION_PATH}/${id}`);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error("Admin not found");
  }

  await docRef.delete();
  return true;
};

// Activate internal admin by ID
export const activateInternalAdminById = async (id, change) => {
  const docRef = db.doc(`${COLLECTION_PATH}/${id}`);
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

// Deactivate internal admin by ID
export const deactivateInternalAdminById = async (id, change) => {
  const docRef = db.doc(`${COLLECTION_PATH}/${id}`);
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

// Get all internal admins
export const getAllInternalAdmins = async () => {
  const collectionRef = db.collection(COLLECTION_PATH);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map((doc) => doc.data());
};

// Get internal admin by email (for login)
export const getInternalAdminByEmail = async (email) => {
  const collectionRef = db.collection(COLLECTION_PATH);
  const snapshot = await collectionRef
    .where("accessDetails.email", "==", email)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data();
};
