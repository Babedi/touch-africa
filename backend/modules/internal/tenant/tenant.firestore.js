import { db } from "../../../services/firestore.client.js";

const serviceId = "southAfrica";

function tenantsCol() {
  return db.collection(`touchAfrica/${serviceId}/tenants`);
}

export async function createTenant(model) {
  const idToUse = model.id;
  await tenantsCol().doc(idToUse).set(model, { merge: true });
  return model;
}

export async function getTenantById(id) {
  const snap = await tenantsCol().doc(id).get();
  return snap.exists ? snap.data() : null;
}

export async function updateTenantById(id, data) {
  await tenantsCol().doc(id).set(data, { merge: true });
}

export async function deleteTenantById(id) {
  await tenantsCol().doc(id).delete();
}

export async function listTenants() {
  const col = await tenantsCol().get();
  return col.docs.map((d) => d.data());
}
