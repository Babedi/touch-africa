import {
  TenantInternalAlarmListSchema,
  newTenantInternalAlarmListId,
} from "./tenant.internal.alarm.list.validation.js";
import {
  createTenantInternalAlarmList,
  getTenantInternalAlarmListById,
  updateTenantInternalAlarmListById,
  deleteTenantInternalAlarmListById,
  getAllTenantInternalAlarmLists,
} from "./tenant.internal.alarm.list.firestore.js";

function nowIso() {
  return new Date().toISOString();
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

export async function serviceCreateTenantInternalAlarmList(
  tenantId,
  body,
  actor
) {
  const id = newTenantInternalAlarmListId();
  const parsed = TenantInternalAlarmListSchema.parse(body);
  const model = {
    id,
    ...parsed,
    created: { by: actor || "system", when: nowIso() },
    updated: { by: actor || "system", when: nowIso() },
  };
  return await createTenantInternalAlarmList(tenantId, model);
}

export async function serviceGetTenantInternalAlarmListById(tenantId, id) {
  return await getTenantInternalAlarmListById(tenantId, id);
}
export async function serviceUpdateTenantInternalAlarmList(
  tenantId,
  id,
  data,
  actor
) {
  return await updateTenantInternalAlarmListById(tenantId, id, {
    ...data,
    updated: { by: actor || "system", when: nowIso() },
  });
}
export async function serviceDeleteTenantInternalAlarmList(tenantId, id) {
  return await deleteTenantInternalAlarmListById(tenantId, id);
}
export async function serviceListTenantInternalAlarmLists(tenantId) {
  return await getAllTenantInternalAlarmLists(tenantId);
}
