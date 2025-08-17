import { db } from "../../../services/firestore.client.js";

const serviceId = "neighbourGuardService";

export const externalAlarmMenuKeys = [
  "externalAlarmsMenuItem1",
  "externalAlarmsMenuItem2",
  "externalAlarmsMenuItem3",
  "externalAlarmsMenuItem4",
  "externalAlarmsMenuItem5",
];

function menuDocRef(tenantId, menuKey) {
  return db.doc(
    `/services/${serviceId}/tenants/${tenantId}/externalAlarms/${menuKey}`
  );
}

export async function putMenuItem(tenantId, menuKey, alarmIds, meta = {}) {
  const ref = menuDocRef(tenantId, menuKey);
  const doc = { alarms: Array.from(new Set(alarmIds)), ...meta };
  await ref.set(doc, { merge: true });
  const snap = await ref.get();
  return snap.exists ? snap.data() : { alarms: [] };
}

export async function getMenuItem(tenantId, menuKey) {
  const ref = menuDocRef(tenantId, menuKey);
  const snap = await ref.get();
  return snap.exists ? snap.data() : { alarms: [] };
}

export async function deleteMenuItemAlarm(tenantId, menuKey, alarmId) {
  const current = await getMenuItem(tenantId, menuKey);
  const next = (current.alarms || []).filter((id) => id !== alarmId);
  await putMenuItem(tenantId, menuKey, next);
  return { alarms: next };
}

export async function listAllMenus(tenantId) {
  const col = db.collection(
    `/services/${serviceId}/tenants/${tenantId}/externalAlarms`
  );
  const snap = await col.get();
  const byKey = {};
  for (const d of snap.docs) {
    byKey[d.id] = d.data().alarms || [];
  }
  return byKey;
}
