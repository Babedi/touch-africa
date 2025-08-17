import { db } from "../../../services/firestore.client.js";

const serviceId = "neighbourGuardService";

export function alarmDocRef(tenantId, alarmId) {
  return db.doc(
    `/services/${serviceId}/tenants/${tenantId}/internalAlarmsList/${alarmId}`
  );
}

export async function createTenantInternalAlarmList(tenantId, alarm) {
  const ref = alarmDocRef(tenantId, alarm.id);
  await ref.set(alarm, { merge: true });
  const snap = await ref.get();
  return snap.data();
}

export async function getTenantInternalAlarmListById(tenantId, alarmId) {
  const ref = alarmDocRef(tenantId, alarmId);
  const snap = await ref.get();
  return snap.exists ? snap.data() : null;
}

export async function updateTenantInternalAlarmListById(
  tenantId,
  alarmId,
  data
) {
  const ref = alarmDocRef(tenantId, alarmId);
  await ref.set(data, { merge: true });
  return await getTenantInternalAlarmListById(tenantId, alarmId);
}

export async function deleteTenantInternalAlarmListById(tenantId, alarmId) {
  const ref = alarmDocRef(tenantId, alarmId);
  await ref.delete();
  return { id: alarmId };
}

export async function getAllTenantInternalAlarmLists(tenantId) {
  const col = db.collection(
    `/services/${serviceId}/tenants/${tenantId}/internalAlarmsList`
  );
  const snap = await col.get();
  return snap.docs.map((d) => d.data());
}
