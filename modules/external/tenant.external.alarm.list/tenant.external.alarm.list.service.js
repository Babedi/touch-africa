import {
  newTenantExternalAlarmListId,
  TenantExternalAlarmListSchema,
} from "./tenant.external.alarm.list.validation.js";
import {
  createTenantExternalAlarmList,
  getTenantExternalAlarmListById,
  updateTenantExternalAlarmListById,
  deleteTenantExternalAlarmListById,
  getAllTenantExternalAlarmLists,
  activateTenantExternalAlarmListById,
  deactivateTenantExternalAlarmListById,
} from "./tenant.external.alarm.list.firestore.js";

function nowIso() {
  return new Date().toISOString();
}

export async function serviceCreateTenantExternalAlarmList(
  tenantId,
  model,
  actor
) {
  const id = newTenantExternalAlarmListId();
  const parsed = TenantExternalAlarmListSchema.parse(model);
  const alarm = {
    id,
    ...parsed,
    created: { by: actor || "system", when: nowIso() },
    updated: { by: actor || "system", when: nowIso() },
  };
  return await createTenantExternalAlarmList(tenantId, alarm);
}

export async function serviceGetTenantExternalAlarmListById(tenantId, alarmId) {
  return await getTenantExternalAlarmListById(tenantId, alarmId);
}

export async function serviceUpdateTenantExternalAlarmList(
  tenantId,
  alarmId,
  data,
  actor
) {
  const update = {
    ...data,
    updated: { by: actor || "system", when: nowIso() },
  };
  return await updateTenantExternalAlarmListById(tenantId, alarmId, update);
}

export async function serviceDeleteTenantExternalAlarmList(tenantId, alarmId) {
  return await deleteTenantExternalAlarmListById(tenantId, alarmId);
}

export async function serviceListTenantExternalAlarmLists(tenantId) {
  return await getAllTenantExternalAlarmLists(tenantId);
}

export async function serviceActivateTenantExternalAlarmList(
  tenantId,
  alarmId,
  actor
) {
  const change = {
    updated: { by: actor || "system", when: nowIso() },
    changes: [{ by: actor || "system", when: nowIso(), action: "activate" }],
  };
  return await activateTenantExternalAlarmListById(tenantId, alarmId, change);
}

export async function serviceDeactivateTenantExternalAlarmList(
  tenantId,
  alarmId,
  actor
) {
  const change = {
    updated: { by: actor || "system", when: nowIso() },
    changes: [{ by: actor || "system", when: nowIso(), action: "deactivate" }],
  };
  return await deactivateTenantExternalAlarmListById(tenantId, alarmId, change);
}

export const readRoles = [
  "internalRootAdmin",
  "internalSuperAdmin",
  "internalAlarmsManager",
];
export const writeRoles = [
  "internalRootAdmin",
  "internalSuperAdmin",
  "internalAlarmsManager",
];
