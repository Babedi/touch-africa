import { db } from "../../../services/firestore.client.js";

const serviceId = "neighbourGuardService";

export function alarmDocRef(tenantId, alarmId) {
  return db.doc(
    `/services/${serviceId}/tenants/${tenantId}/externalAlarmsList/${alarmId}`
  );
}

export async function createTenantExternalAlarmList(tenantId, alarm) {
  const ref = alarmDocRef(tenantId, alarm.id);
  await ref.set(alarm, { merge: true });
  const snap = await ref.get();
  return snap.data();
}

export async function getTenantExternalAlarmListById(tenantId, alarmId) {
  const ref = alarmDocRef(tenantId, alarmId);
  const snap = await ref.get();
  return snap.exists ? snap.data() : null;
}

export async function updateTenantExternalAlarmListById(
  tenantId,
  alarmId,
  data
) {
  const ref = alarmDocRef(tenantId, alarmId);
  await ref.set(data, { merge: true });
  return await getTenantExternalAlarmListById(tenantId, alarmId);
}

export async function deleteTenantExternalAlarmListById(tenantId, alarmId) {
  const ref = alarmDocRef(tenantId, alarmId);
  await ref.delete();
  return { id: alarmId };
}

export async function getAllTenantExternalAlarmLists(tenantId) {
  const col = db.collection(
    `/services/${serviceId}/tenants/${tenantId}/externalAlarmsList`
  );
  const snap = await col.get();
  return snap.docs.map((d) => d.data());
}

export async function activateTenantExternalAlarmListById(
  tenantId,
  alarmId,
  change = {}
) {
  const ref = alarmDocRef(tenantId, alarmId);
  await ref.set({ account: { isActive: true }, ...change }, { merge: true });
  const snap = await ref.get();
  return snap.exists ? snap.data() : null;
}

export async function deactivateTenantExternalAlarmListById(
  tenantId,
  alarmId,
  change = {}
) {
  const ref = alarmDocRef(tenantId, alarmId);
  await ref.set({ account: { isActive: false }, ...change }, { merge: true });
  const snap = await ref.get();
  return snap.exists ? snap.data() : null;
}
