import {
  listMenu,
  getMenuItem,
  putMenuItem,
  deleteMenuItem,
} from "./tenant.internal.responder.firestore.js";
import { getAllTenantInternalResponderLists } from "../tenant.internal.responder.list/tenant.internal.responder.list.firestore.js";

function nowIso() {
  return new Date().toISOString();
}

async function validateIdsExist(tenantId, ids) {
  const existing = await getAllTenantInternalResponderLists(tenantId);
  const set = new Set(existing.map((x) => x.id));
  for (const id of ids) {
    if (!set.has(id)) {
      const err = new Error(
        `Responder id ${id} not found in internalRespondersList`
      );
      err.status = 400;
      throw err;
    }
  }
}

export async function servicePutMenuItem(tenantId, key, responderIds, actor) {
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
