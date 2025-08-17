import { db } from "../../../services/firestore.client.js";

const serviceId = "neighbourGuardService";

export async function createTenantInternalResponderList(tenantId, model) {
  const docRef = db.doc(
    `/services/${serviceId}/tenants/${tenantId}/internalRespondersList/${model.id}`
  );
  await docRef.set(model, { merge: true });
  return (await docRef.get()).data();
}

export async function getTenantInternalResponderListById(tenantId, id) {
  const docRef = db.doc(
    `/services/${serviceId}/tenants/${tenantId}/internalRespondersList/${id}`
  );
  const snap = await docRef.get();
  return snap.exists ? snap.data() : null;
}

export async function updateTenantInternalResponderListById(
  tenantId,
  id,
  data
) {
  const docRef = db.doc(
    `/services/${serviceId}/tenants/${tenantId}/internalRespondersList/${id}`
  );
  await docRef.set(data, { merge: true });
  const snap = await docRef.get();
  return snap.exists ? snap.data() : null;
}

export async function deleteTenantInternalResponderListById(tenantId, id) {
  const docRef = db.doc(
    `/services/${serviceId}/tenants/${tenantId}/internalRespondersList/${id}`
  );
  await docRef.delete();
  return { id };
}

export async function getAllTenantInternalResponderLists(tenantId) {
  const colRef = db.collection(
    `/services/${serviceId}/tenants/${tenantId}/internalRespondersList`
  );
  const snap = await colRef.get();
  const items = [];
  snap.forEach((d) => items.push(d.data()));
  return items;
}
