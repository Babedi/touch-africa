import { TenantExternalResponderUpdateSchema } from "./tenant.external.responder.validation.js";
import {
  listMenu,
  getMenuItem,
  putMenuItem,
  deleteMenuItem,
} from "./tenant.external.responder.firestore.js";

// Validate that each id exists under externalRespondersList of same tenant
import { getAllTenantExternalResponderLists } from "../tenant.external.responder.list/tenant.external.responder.list.firestore.js";

function nowIso() {
  return new Date().toISOString();
}

async function validateIdsExist(tenantId, ids) {
  const existing = await getAllTenantExternalResponderLists(tenantId);
  const set = new Set(existing.map((x) => x.id));
  for (const id of ids) {
    if (!set.has(id)) {
      const err = new Error(
        `Responder id ${id} not found in externalRespondersList`
      );
      err.status = 400;
      throw err;
    }
  }
}

export async function servicePutMenuItem(tenantId, key, responderIds, actor) {
  // ensure no duplicates within the array
  const unique = [...new Set(responderIds)];
  await validateIdsExist(tenantId, unique);
  const saved = await putMenuItem(tenantId, key, unique);
  return {
    key,
    responders: saved.responders,
    updated: { by: actor || "system", when: nowIso() },
  };
}

export async function serviceGetMenuItem(tenantId, key) {
  const data = await getMenuItem(tenantId, key);
  return { key, ...data };
}

export async function serviceDeleteMenuItem(tenantId, key) {
  await deleteMenuItem(tenantId, key);
  return { key };
}

export async function serviceListMenu(tenantId) {
  return await listMenu(tenantId);
}

export const readRoles = [
  "internalRootAdmin",
  "internalSuperAdmin",
  "internalRespondersManager",
  "externalRootAdmin",
  "externalSuperAdmin",
  "externalRespondersManager",
];
export const writeRoles = [...readRoles];
