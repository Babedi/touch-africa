import { db } from "../../../services/firestore.client.js";

const serviceId = "southAfrica";
const docRef = db.doc(`touchAfrica/${serviceId}`);

export async function getServiceInfo() {
  const snap = await docRef.get();
  return snap.exists ? snap.data() : null;
}

export async function updateServiceInfo(data) {
  await docRef.set(data, { merge: true });
  return await getServiceInfo();
}
