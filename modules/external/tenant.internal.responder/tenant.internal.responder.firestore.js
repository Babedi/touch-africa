import { db } from "../../../services/firestore.client.js";

const serviceId = "neighbourGuardService";
const base = (tenantId) =>
  `/services/${serviceId}/tenants/${tenantId}/internalResponders`;

export async function putMenuItem(tenantId, key, responderIds) {
  const docRef = db.doc(`${base(tenantId)}/${key}`);
  await docRef.set({ responders: responderIds }, { merge: true });
  const snap = await docRef.get();
  return snap.exists ? snap.data() : { responders: [] };
}

export async function getMenuItem(tenantId, key) {
  const snap = await db.doc(`${base(tenantId)}/${key}`).get();
  return snap.exists ? snap.data() : { responders: [] };
}

export async function deleteMenuItem(tenantId, key) {
  await db.doc(`${base(tenantId)}/${key}`).delete();
  return { key };
}

export async function listMenu(tenantId) {
  const snap = await db.collection(base(tenantId)).get();
  const items = {};
  snap.forEach((d) => {
    items[d.id] = d.data();
  });
  return items;
}
