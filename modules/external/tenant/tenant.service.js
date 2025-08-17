import {
  TenantSchema,
  TenantUpdateSchema,
  newTenantId,
} from "./tenant.validation.js";
import { getServiceInfo } from "../../general/service.info/service.info.firestore.js";
import {
  createTenant,
  getTenantById,
  updateTenantById,
  deleteTenantById,
  listTenants,
} from "./tenant.firestore.js";

function sanitize(x) {
  return x; // nothing sensitive in tenant at present
}

export async function serviceCreateTenant(payload, actor = "system") {
  const parsed = TenantSchema.parse(payload);
  // Validate province membership against lookups
  const svc = await getServiceInfo();
  const provinces = new Set(
    ((svc && svc.lookups && svc.lookups.provinces) || []).map(String)
  );
  if (provinces.size && !provinces.has(String(parsed.address.province))) {
    const err = new Error("Invalid province");
    err.status = 400;
    throw err;
  }

  const id = newTenantId();
  const model = {
    id,
    ...parsed,
    created: { by: actor, when: new Date().toISOString() },
    account: parsed.account || { isActive: { value: true, changes: [] } },
  };
  const saved = await createTenant(model);
  return sanitize(saved);
}

export async function serviceGetTenantById(id) {
  const data = await getTenantById(id);
  return data ? sanitize(data) : null;
}

export async function serviceListTenants() {
  const list = await listTenants();
  return list.map(sanitize);
}

export async function serviceUpdateTenant(id, patch) {
  const parsed = TenantUpdateSchema.parse(patch);
  // If province is being updated, validate again
  if (parsed?.address?.province) {
    const svc = await getServiceInfo();
    const provinces = new Set(
      ((svc && svc.lookups && svc.lookups.provinces) || []).map(String)
    );
    if (provinces.size && !provinces.has(String(parsed.address.province))) {
      const err = new Error("Invalid province");
      err.status = 400;
      throw err;
    }
  }
  await updateTenantById(id, parsed);
  return await serviceGetTenantById(id);
}

export async function serviceDeleteTenant(id) {
  await deleteTenantById(id);
}
