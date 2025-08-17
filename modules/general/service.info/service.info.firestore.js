import { db } from "../../../services/firestore.client.js";

const serviceId = "neighbourGuardService";
const docRef = db.doc(`services/${serviceId}`);

export async function getServiceInfo() {
  const snap = await docRef.get();
  return snap.exists ? snap.data() : null;
}

export async function updateServiceInfo(data) {
  await docRef.set(data, { merge: true });
  return await getServiceInfo();
}
