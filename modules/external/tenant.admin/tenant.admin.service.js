import bcrypt from "bcryptjs";
import {
  TenantAdminSchema,
  TenantAdminUpdateSchema,
  newTenantAdminId,
} from "./tenant.admin.validation.js";
import {
  createTenantAdmin,
  getTenantAdminById,
  updateTenantAdminById,
  deleteTenantAdminById,
  listTenantAdmins,
} from "./tenant.admin.firestore.js";
import { getServiceInfo } from "../../general/service.info/service.info.firestore.js";

export const tenantAdminReadRoles = [
  "externalRootAdmin",
  "externalSuperAdmin",
  "internalRootAdmin",
  "internalSuperAdmin",
  "tenantAdmin", // Added tenantAdmin role
];

export const tenantAdminWriteRoles = [
  "externalRootAdmin",
  "externalSuperAdmin",
  "internalRootAdmin",
  "internalSuperAdmin",
  "tenantAdmin", // Added tenantAdmin role
];

export async function serviceCreateTenantAdmin(
  tenantId,
  payload,
  actor = "system"
) {
  const parsed = TenantAdminSchema.parse(payload);
  // Validate title from lookups and password format from formats
  const svc = await getServiceInfo();
  const titles = new Set(
    ((svc && svc.lookups && svc.lookups.titlePrefixes) || []).map(String)
  );
  if (titles.size && !titles.has(String(parsed.title))) {
    const err = new Error("Invalid title prefix");
    err.status = 400;
    throw err;
  }
  const pwdRegex =
    svc && svc.formats && svc.formats.passwords && svc.formats.passwords.regex
      ? new RegExp(svc.formats.passwords.regex)
      : /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  if (!pwdRegex.test(parsed.accessDetails.password)) {
    const err = new Error("Password does not meet required format");
    err.status = 400;
    throw err;
  }
  const id = newTenantAdminId();
  const hashed = await bcrypt.hash(parsed.accessDetails.password, 10);
  const model = {
    ...parsed,
    id,
    created: { by: actor, when: new Date().toISOString() },
    accessDetails: { ...parsed.accessDetails, password: hashed },
    account: parsed.account || { isActive: { value: true, changes: [] } },
  };
  await createTenantAdmin(tenantId, model);
  return sanitize(model);
}

export async function serviceGetTenantAdminById(tenantId, id) {
  const data = await getTenantAdminById(tenantId, id);
  return data ? sanitize(data) : null;
}

export async function serviceListTenantAdmins(tenantId) {
  const list = await listTenantAdmins(tenantId);
  return list.map(sanitize);
}

export async function serviceUpdateTenantAdmin(tenantId, id, patch) {
  const parsed = TenantAdminUpdateSchema.parse(patch);
  if (parsed?.accessDetails?.password) {
    const svc = await getServiceInfo();
    const pwdRegex =
      svc && svc.formats && svc.formats.passwords && svc.formats.passwords.regex
        ? new RegExp(svc.formats.passwords.regex)
        : /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!pwdRegex.test(parsed.accessDetails.password)) {
      const err = new Error("Password does not meet required format");
      err.status = 400;
      throw err;
    }
    parsed.accessDetails.password = await bcrypt.hash(
      parsed.accessDetails.password,
      10
    );
  }
  await updateTenantAdminById(tenantId, id, parsed);
  return await serviceGetTenantAdminById(tenantId, id);
}

export async function serviceDeleteTenantAdmin(tenantId, id) {
  await deleteTenantAdminById(tenantId, id);
}

function sanitize(obj) {
  const { accessDetails, ...rest } = obj;
  return {
    ...rest,
    accessDetails: { ...accessDetails, password: undefined },
  };
}
