import { getServiceInfo } from "../../general/service.info/service.info.firestore.js";
import {
  TenantUserPrivateRespondersSchema,
  TenantUserPrivateRespondersUpdateSchema,
  newTenantUserPrivateRespondersId,
} from "./tenant.user.private.responders.validation.js";
import {
  createTenantUserPrivateResponder,
  getTenantUserPrivateResponderById,
  updateTenantUserPrivateResponderById,
  deleteTenantUserPrivateResponderById,
  listTenantUserPrivateResponders,
} from "./tenant.user.private.responders.firestore.js";

function actorOf(req) {
  const p = req.admin || req.user || {};
  return p.id || p.email || "anonymous";
}

function sanitize(x) {
  return x; // nothing sensitive here
}

export async function serviceCreateTenantUserPrivateResponder(
  tenantId,
  userId,
  payload,
  actor
) {
  const parsed = TenantUserPrivateRespondersSchema.parse(payload);
  const svc = await getServiceInfo();
  const titles = new Set(
    ((svc && svc.lookups && svc.lookups.titlePrefixes) || []).map(String)
  );
  if (titles.size && !titles.has(String(parsed.title))) {
    const err = new Error("Invalid title prefix");
    err.status = 400;
    throw err;
  }
  const langs = new Set(
    ((svc && svc.lookups && svc.lookups.languages) || []).map(String)
  );
  if (
    langs.size &&
    !langs.has(String(parsed.activationDetails.preferredMenuLanguage))
  ) {
    const err = new Error("Invalid language");
    err.status = 400;
    throw err;
  }

  const model = {
    id: newTenantUserPrivateRespondersId(),
    ...parsed,
    created: { by: actor, when: new Date().toISOString() },
    account: parsed.account || { isActive: { value: true, changes: [] } },
  };
  await createTenantUserPrivateResponder(tenantId, userId, model);
  return sanitize(model);
}

export async function serviceGetTenantUserPrivateResponderById(
  tenantId,
  userId,
  id
) {
  const data = await getTenantUserPrivateResponderById(tenantId, userId, id);
  return data ? sanitize(data) : null;
}

export async function serviceListTenantUserPrivateResponders(tenantId, userId) {
  const list = await listTenantUserPrivateResponders(tenantId, userId);
  return list.map(sanitize);
}

export async function serviceUpdateTenantUserPrivateResponder(
  tenantId,
  userId,
  id,
  patch
) {
  const parsed = TenantUserPrivateRespondersUpdateSchema.parse(patch);
  if (parsed?.activationDetails?.preferredMenuLanguage) {
    const svc = await getServiceInfo();
    const langs = new Set(
      ((svc && svc.lookups && svc.lookups.languages) || []).map(String)
    );
    if (
      langs.size &&
      !langs.has(String(parsed.activationDetails.preferredMenuLanguage))
    ) {
      const err = new Error("Invalid language");
      err.status = 400;
      throw err;
    }
  }
  await updateTenantUserPrivateResponderById(tenantId, userId, id, parsed);
  return await serviceGetTenantUserPrivateResponderById(tenantId, userId, id);
}

export async function serviceDeleteTenantUserPrivateResponder(
  tenantId,
  userId,
  id
) {
  await deleteTenantUserPrivateResponderById(tenantId, userId, id);
}
