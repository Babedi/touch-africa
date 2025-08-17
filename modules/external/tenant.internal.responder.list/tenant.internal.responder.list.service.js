import {
  newTenantInternalResponderListId,
  TenantInternalResponderListSchema,
  TenantInternalResponderListUpdateSchema,
} from "./tenant.internal.responder.list.validation.js";
import {
  createTenantInternalResponderList,
  getTenantInternalResponderListById,
  updateTenantInternalResponderListById,
  deleteTenantInternalResponderListById,
  getAllTenantInternalResponderLists,
} from "./tenant.internal.responder.list.firestore.js";
import { getServiceInfo } from "../../general/service.info/service.info.firestore.js";

function nowIso() {
  return new Date().toISOString();
}

async function validateLookups(model) {
  const svc = await getServiceInfo();
  const types = svc?.lookups?.responderTypes || [];
  const channels = svc?.lookups?.communicationChannels || [];
  if (!types.includes(model.type)) {
    throw Object.assign(new Error("Invalid responder type"), {
      status: 400,
      details: { allowed: types },
    });
  }
  if (!channels.includes(model.channel)) {
    throw Object.assign(new Error("Invalid communication channel"), {
      status: 400,
      details: { allowed: channels },
    });
  }
}

export async function serviceCreateTenantInternalResponderList(
  tenantId,
  model,
  actor
) {
  const id = newTenantInternalResponderListId();
  const parsed = TenantInternalResponderListSchema.parse(model);
  await validateLookups(parsed);
  const item = {
    id,
    ...parsed,
    account: { isActive: true, changes: [] },
    created: { by: actor || "system", when: nowIso() },
    updated: { by: actor || "system", when: nowIso() },
  };
  return await createTenantInternalResponderList(tenantId, item);
}

export async function serviceGetTenantInternalResponderListById(tenantId, id) {
  return await getTenantInternalResponderListById(tenantId, id);
}

export async function serviceListTenantInternalResponderLists(tenantId) {
  return await getAllTenantInternalResponderLists(tenantId);
}

export async function serviceUpdateTenantInternalResponderList(
  tenantId,
  id,
  data,
  actor
) {
  const parsed = TenantInternalResponderListUpdateSchema.parse(data);
  const base = await getTenantInternalResponderListById(tenantId, id);
  if (!base) throw Object.assign(new Error("Not found"), { status: 404 });
  const merged = { ...base, ...parsed };
  await validateLookups(merged);
  merged.updated = { by: actor || "system", when: nowIso() };
  return await updateTenantInternalResponderListById(tenantId, id, merged);
}

export async function serviceActivateTenantInternalResponderList(
  tenantId,
  id,
  actor
) {
  const base = await getTenantInternalResponderListById(tenantId, id);
  if (!base) throw Object.assign(new Error("Not found"), { status: 404 });
  const change = { when: nowIso(), by: actor || "system", action: "activate" };
  const updated = {
    ...base,
    account: {
      isActive: true,
      changes: [...(base.account?.changes || []), change],
    },
    updated: { by: actor || "system", when: nowIso() },
  };
  return await updateTenantInternalResponderListById(tenantId, id, updated);
}

export async function serviceDeactivateTenantInternalResponderList(
  tenantId,
  id,
  actor
) {
  const base = await getTenantInternalResponderListById(tenantId, id);
  if (!base) throw Object.assign(new Error("Not found"), { status: 404 });
  const change = {
    when: nowIso(),
    by: actor || "system",
    action: "deactivate",
  };
  const updated = {
    ...base,
    account: {
      isActive: false,
      changes: [...(base.account?.changes || []), change],
    },
    updated: { by: actor || "system", when: nowIso() },
  };
  return await updateTenantInternalResponderListById(tenantId, id, updated);
}

export async function serviceDeleteTenantInternalResponderList(tenantId, id) {
  return await deleteTenantInternalResponderListById(tenantId, id);
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
