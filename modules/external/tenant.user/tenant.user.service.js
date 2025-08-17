import { getServiceInfo } from "../../general/service.info/service.info.firestore.js";
import {
  TenantUserSchema,
  TenantUserUpdateSchema,
  newTenantUserId,
} from "./tenant.user.validation.js";
import {
  createTenantUser,
  getTenantUserById,
  updateTenantUserById,
  deleteTenantUserById,
  listTenantUsers,
} from "./tenant.user.firestore.js";

function sanitize(x) {
  return x; // nothing secret
}

export async function serviceCreateTenantUser(
  tenantId,
  payload,
  actor = "system"
) {
  const parsed = TenantUserSchema.parse(payload);
  const svc = await getServiceInfo();
  const titles = new Set((svc?.lookups?.titlePrefixes || []).map(String));
  if (titles.size && !titles.has(String(parsed.title))) {
    const err = new Error("Invalid title prefix");
    err.status = 400;
    throw err;
  }
  const langs = new Set((svc?.lookups?.languages || []).map(String));
  if (
    langs.size &&
    !langs.has(String(parsed.activationDetails.preferredMenuLanguage))
  ) {
    const err = new Error("Invalid language");
    err.status = 400;
    throw err;
  }
  const model = {
    id: newTenantUserId(),
    ...parsed,
    created: { by: actor, when: new Date().toISOString() },
    account: parsed.account || { isActive: { value: true, changes: [] } },
  };
  await createTenantUser(tenantId, model);
  return sanitize(model);
}

export async function serviceGetTenantUserById(tenantId, id) {
  const data = await getTenantUserById(tenantId, id);
  return data ? sanitize(data) : null;
}

export async function serviceListTenantUsers(tenantId) {
  const list = await listTenantUsers(tenantId);
  return list.map(sanitize);
}

export async function serviceUpdateTenantUser(tenantId, id, patch) {
  const parsed = TenantUserUpdateSchema.parse(patch);
  if (parsed?.activationDetails?.preferredMenuLanguage) {
    const svc = await getServiceInfo();
    const langs = new Set((svc?.lookups?.languages || []).map(String));
    if (
      langs.size &&
      !langs.has(String(parsed.activationDetails.preferredMenuLanguage))
    ) {
      const err = new Error("Invalid language");
      err.status = 400;
      throw err;
    }
  }
  // If account.isActive.changes present, try to append rather than replace (best-effort)
  if (parsed?.account?.isActive?.changes) {
    try {
      const current = await getTenantUserById(tenantId, id);
      const existing = Array.isArray(current?.account?.isActive?.changes)
        ? current.account.isActive.changes
        : [];
      parsed.account.isActive.changes = [
        ...existing,
        ...parsed.account.isActive.changes,
      ];
    } catch {}
  }
  await updateTenantUserById(tenantId, id, parsed);
  return await serviceGetTenantUserById(tenantId, id);
}

export async function serviceDeleteTenantUser(tenantId, id) {
  await deleteTenantUserById(tenantId, id);
}
