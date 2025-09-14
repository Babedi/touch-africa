import { db } from "../../../services/firestore.client.js";

const serviceId = "southAfrica";

export async function createServiceRequest(model) {
  const ref = db
    .collection(`touchAfrica/${serviceId}/serviceRequests`)
    .doc(model.id);
  await ref.set(model, { merge: true });
  return model;
}

export async function getServiceRequestById(id) {
  const ref = db.collection(`touchAfrica/${serviceId}/serviceRequests`).doc(id);
  const snap = await ref.get();
  return snap.exists ? snap.data() : null;
}

export async function updateServiceRequestById(id, data) {
  const ref = db.collection(`touchAfrica/${serviceId}/serviceRequests`).doc(id);
  await ref.set(data, { merge: true });
}

export async function deleteServiceRequestById(id) {
  const ref = db.collection(`touchAfrica/${serviceId}/serviceRequests`).doc(id);
  await ref.delete();
}

export async function getAllServiceRequests() {
  const col = await db
    .collection(`touchAfrica/${serviceId}/serviceRequests`)
    .get();
  return col.docs.map((d) => d.data());
}
