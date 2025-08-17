import { z } from "zod";
import {
  InternalAlarmMenuKeySchema,
  InternalAlarmMenuUpdateSchema,
  InternalAlarmMenuKeyedUpdateSchema,
} from "./tenant.internal.alarm.validation.js";
import {
  putMenuItem,
  getMenuItem,
  deleteMenuItemAlarm,
  listAllMenus,
} from "./tenant.internal.alarm.firestore.js";
import {
  getTenantInternalAlarmListById,
  getAllTenantInternalAlarmLists,
} from "../tenant.internal.alarm.list/tenant.internal.alarm.list.firestore.js";

function nowIso() {
  return new Date().toISOString();
}

export const readRoles = [
  "internalRootAdmin",
  "internalSuperAdmin",
  "internalAlarmsManager",
  "externalRootAdmin",
  "externalSuperAdmin",
  "externalAlarmsManager",
];
export const writeRoles = [...readRoles];

async function validateIdsExist(tenantId, ids) {
  if (!ids?.length) return [];
  const all = await getAllTenantInternalAlarmLists(tenantId);
  const allowed = new Set((all || []).map((a) => a.id));
  const invalid = ids.filter((i) => !allowed.has(i));
  if (invalid.length) {
    const err = new Error("InvalidAlarmIds");
    err.status = 400;
    err.details = { invalid };
    throw err;
  }
  return Array.from(new Set(ids));
}

export async function servicePutMenuItem(tenantId, menuKey, body, actor) {
  InternalAlarmMenuKeySchema.parse(menuKey);
  let ids = [];
  if (body && Array.isArray(body.alarmIds)) {
    ids = body.alarmIds;
  } else if (body && Array.isArray(body[menuKey])) {
    ids = body[menuKey];
  } else if (Array.isArray(body)) {
    ids = body; // tolerate raw array
  }
  const unique = await validateIdsExist(tenantId, ids);
  const meta = { updated: { by: actor || "system", when: nowIso() } };
  const saved = await putMenuItem(tenantId, menuKey, unique, meta);
  return { key: menuKey, alarms: saved.alarms || [] };
}

export async function serviceGetMenuItemList(tenantId, menuKey) {
  InternalAlarmMenuKeySchema.parse(menuKey);
  const stored = await getMenuItem(tenantId, menuKey);
  const ids = stored.alarms || [];
  const detailed = await Promise.all(
    ids.map((id) => getTenantInternalAlarmListById(tenantId, id))
  );
  return (detailed || []).filter(Boolean);
}

export async function serviceGetMenuItemAlarm(tenantId, menuKey, alarmId) {
  InternalAlarmMenuKeySchema.parse(menuKey);
  const stored = await getMenuItem(tenantId, menuKey);
  const ids = new Set(stored.alarms || []);
  if (!ids.has(alarmId)) return null;
  return await getTenantInternalAlarmListById(tenantId, alarmId);
}

export async function serviceDeleteMenuItemAlarm(tenantId, menuKey, alarmId) {
  InternalAlarmMenuKeySchema.parse(menuKey);
  await deleteMenuItemAlarm(tenantId, menuKey, alarmId);
  return { key: menuKey, removed: alarmId };
}

export async function serviceListAllMenus(tenantId) {
  const byKey = await listAllMenus(tenantId);
  const result = {};
  for (const [key, ids] of Object.entries(byKey)) {
    result[key] = (
      await Promise.all(
        (ids || []).map((id) => getTenantInternalAlarmListById(tenantId, id))
      )
    ).filter(Boolean);
  }
  return result;
}
