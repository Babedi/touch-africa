import { z } from "zod";
import {
  ExternalAlarmMenuUpdateSchema,
  ExternalAlarmMenuKeyedUpdateSchema,
  ExternalAlarmMenuKeySchema,
} from "./tenant.external.alarm.validation.js";
import {
  putMenuItem,
  getMenuItem,
  deleteMenuItemAlarm,
  listAllMenus,
} from "./tenant.external.alarm.firestore.js";
import {
  getTenantExternalAlarmListById,
  getAllTenantExternalAlarmLists,
} from "../tenant.external.alarm.list/tenant.external.alarm.list.firestore.js";

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
  const all = await getAllTenantExternalAlarmLists(tenantId);
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
  ExternalAlarmMenuKeySchema.parse(menuKey);
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
  ExternalAlarmMenuKeySchema.parse(menuKey);
  const stored = await getMenuItem(tenantId, menuKey);
  const ids = stored.alarms || [];
  const detailed = await Promise.all(
    ids.map((id) => getTenantExternalAlarmListById(tenantId, id))
  );
  return (detailed || []).filter(Boolean);
}

export async function serviceGetMenuItemAlarm(tenantId, menuKey, alarmId) {
  ExternalAlarmMenuKeySchema.parse(menuKey);
  const stored = await getMenuItem(tenantId, menuKey);
  const ids = new Set(stored.alarms || []);
  if (!ids.has(alarmId)) return null;
  return await getTenantExternalAlarmListById(tenantId, alarmId);
}

export async function serviceDeleteMenuItemAlarm(tenantId, menuKey, alarmId) {
  ExternalAlarmMenuKeySchema.parse(menuKey);
  await deleteMenuItemAlarm(tenantId, menuKey, alarmId);
  return { key: menuKey, removed: alarmId };
}

export async function serviceListAllMenus(tenantId) {
  const byKey = await listAllMenus(tenantId);
  const result = {};
  for (const [key, ids] of Object.entries(byKey)) {
    result[key] = (
      await Promise.all(
        (ids || []).map((id) => getTenantExternalAlarmListById(tenantId, id))
      )
    ).filter(Boolean);
  }
  return result;
}
