import {
  newTenantExternalResponderListId,
  TenantExternalResponderListSchema,
  TenantExternalResponderListUpdateSchema,
} from "./tenant.external.responder.list.validation.js";
import {
  createTenantExternalResponderList,
  getTenantExternalResponderListById,
  updateTenantExternalResponderListById,
  deleteTenantExternalResponderListById,
  getAllTenantExternalResponderLists,
} from "./tenant.external.responder.list.firestore.js";
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

export async function serviceCreateTenantExternalResponderList(
  tenantId,
  model,
  actor
) {
  const id = newTenantExternalResponderListId();
  const parsed = TenantExternalResponderListSchema.parse(model);
  await validateLookups(parsed);
  const item = {
    id,
    ...parsed,
    account: { isActive: true, changes: [] },
    created: { by: actor || "system", when: nowIso() },
    updated: { by: actor || "system", when: nowIso() },
  };
  return await createTenantExternalResponderList(tenantId, item);
}

export async function serviceGetTenantExternalResponderListById(tenantId, id) {
  return await getTenantExternalResponderListById(tenantId, id);
}

export async function serviceListTenantExternalResponderLists(tenantId) {
  return await getAllTenantExternalResponderLists(tenantId);
}

export async function serviceUpdateTenantExternalResponderList(
  tenantId,
  id,
  data,
  actor
) {
  const parsed = TenantExternalResponderListUpdateSchema.parse(data);
  const base = await getTenantExternalResponderListById(tenantId, id);
  if (!base) throw Object.assign(new Error("Not found"), { status: 404 });
  const merged = { ...base, ...parsed };
  await validateLookups(merged);
  merged.updated = { by: actor || "system", when: nowIso() };
  return await updateTenantExternalResponderListById(tenantId, id, merged);
}

export async function serviceActivateTenantExternalResponderList(
  tenantId,
  id,
  actor
) {
  const base = await getTenantExternalResponderListById(tenantId, id);
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
  return await updateTenantExternalResponderListById(tenantId, id, updated);
}

export async function serviceDeactivateTenantExternalResponderList(
  tenantId,
  id,
  actor
) {
  const base = await getTenantExternalResponderListById(tenantId, id);
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
  return await updateTenantExternalResponderListById(tenantId, id, updated);
}

export async function serviceDeleteTenantExternalResponderList(tenantId, id) {
  return await deleteTenantExternalResponderListById(tenantId, id);
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
