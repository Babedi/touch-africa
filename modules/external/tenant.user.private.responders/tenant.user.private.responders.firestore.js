import { db } from "../../../services/firestore.client.js";

const serviceId = "neighbourGuardService";

function col(tenantId, userId) {
  return db.collection(
    `services/${serviceId}/tenants/${tenantId}/users/${userId}/privateResponders`
  );
}

export async function createTenantUserPrivateResponder(
  tenantId,
  userId,
  model
) {
  await col(tenantId, userId).doc(model.id).set(model, { merge: true });
  return model;
}

export async function getTenantUserPrivateResponderById(tenantId, userId, id) {
  const snap = await col(tenantId, userId).doc(id).get();
  return snap.exists ? snap.data() : null;
}

export async function updateTenantUserPrivateResponderById(
  tenantId,
  userId,
  id,
  data
) {
  await col(tenantId, userId).doc(id).set(data, { merge: true });
}

export async function deleteTenantUserPrivateResponderById(
  tenantId,
  userId,
  id
) {
  await col(tenantId, userId).doc(id).delete();
}

export async function listTenantUserPrivateResponders(tenantId, userId) {
  const q = await col(tenantId, userId).get();
  return q.docs.map((d) => d.data());
}
