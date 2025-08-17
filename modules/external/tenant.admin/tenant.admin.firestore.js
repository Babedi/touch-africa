import { db } from "../../../services/firestore.client.js";

const serviceId = "neighbourGuardService";

function adminsCol(tenantId) {
  return db.collection(`services/${serviceId}/tenants/${tenantId}/admins`);
}

export async function createTenantAdmin(tenantId, model) {
  const ref = adminsCol(tenantId).doc(model.id);
  await ref.set(model, { merge: true });
  return model;
}

export async function getTenantAdminById(tenantId, id) {
  const snap = await adminsCol(tenantId).doc(id).get();
  return snap.exists ? snap.data() : null;
}

export async function updateTenantAdminById(tenantId, id, data) {
  await adminsCol(tenantId).doc(id).set(data, { merge: true });
}

export async function deleteTenantAdminById(tenantId, id) {
  await adminsCol(tenantId).doc(id).delete();
}

export async function listTenantAdmins(tenantId) {
  const col = await adminsCol(tenantId).get();
  return col.docs.map((d) => d.data());
}
