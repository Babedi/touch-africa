import { db } from "../../../services/firestore.client.js";

const serviceId = "southAfrica";

function usersCol(tenantId) {
  return db.collection(`touchAfrica/${serviceId}/tenants/${tenantId}/users`);
}

export async function createTenantUser(tenantId, model) {
  await usersCol(tenantId).doc(model.id).set(model, { merge: true });
  return model;
}

export async function getTenantUserById(tenantId, id) {
  const snap = await usersCol(tenantId).doc(id).get();
  return snap.exists ? snap.data() : null;
}

export async function updateTenantUserById(tenantId, id, data) {
  await usersCol(tenantId).doc(id).set(data, { merge: true });
}

export async function deleteTenantUserById(tenantId, id) {
  await usersCol(tenantId).doc(id).delete();
}

export async function listTenantUsers(tenantId) {
  const q = await usersCol(tenantId).get();
  return q.docs.map((d) => d.data());
}
