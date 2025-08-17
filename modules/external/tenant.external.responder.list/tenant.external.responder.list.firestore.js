import { db } from "../../../services/firestore.client.js";

const serviceId = "neighbourGuardService";

export async function createTenantExternalResponderList(tenantId, model) {
  const docRef = db.doc(
    `/services/${serviceId}/tenants/${tenantId}/externalRespondersList/${model.id}`
  );
  await docRef.set(model, { merge: true });
  return (await docRef.get()).data();
}

export async function getTenantExternalResponderListById(tenantId, id) {
  const docRef = db.doc(
    `/services/${serviceId}/tenants/${tenantId}/externalRespondersList/${id}`
  );
  const snap = await docRef.get();
  return snap.exists ? snap.data() : null;
}

export async function updateTenantExternalResponderListById(
  tenantId,
  id,
  data
) {
  const docRef = db.doc(
    `/services/${serviceId}/tenants/${tenantId}/externalRespondersList/${id}`
  );
  await docRef.set(data, { merge: true });
  const snap = await docRef.get();
  return snap.exists ? snap.data() : null;
}

export async function deleteTenantExternalResponderListById(tenantId, id) {
  const docRef = db.doc(
    `/services/${serviceId}/tenants/${tenantId}/externalRespondersList/${id}`
  );
  await docRef.delete();
  return { id };
}

export async function getAllTenantExternalResponderLists(tenantId) {
  const colRef = db.collection(
    `/services/${serviceId}/tenants/${tenantId}/externalRespondersList`
  );
  const snap = await colRef.get();
  const items = [];
  snap.forEach((d) => items.push(d.data()));
  return items;
}
