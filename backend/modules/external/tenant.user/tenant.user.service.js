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
import {
  paginateArray,
  sortArray,
  searchInArray,
  generateCSV,
  generateJSON,
  generateStats,
} from "../../../utilities/query.util.js";

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
  const titleList = svc?.lookups?.titlePrefixes;
  if (!Array.isArray(titleList) || titleList.length === 0) {
    const err = new Error("Title prefixes lookup missing or empty");
    err.status = 500;
    throw err;
  }
  const titles = new Set(titleList.map(String));
  if (!titles.has(String(parsed.title))) {
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

/**
 * List tenant users with comprehensive query support
 */
export async function listTenantUsersService(tenantId, queryParams = {}) {
  try {
    const users = (await listTenantUsers(tenantId)).map(sanitize);

    let filtered = users;
    if (queryParams.search) {
      const fields = [
        "names",
        "surname",
        "title",
        "activationDetails.phoneNumber",
        "activationDetails.preferredMenuLanguage",
      ];
      filtered = searchInArray(filtered, queryParams.search, fields);
    }

    if (queryParams.status) {
      const isActive = String(queryParams.status).toLowerCase() === "active";
      filtered = filtered.filter(
        (u) => u?.account?.isActive?.value === isActive
      );
    }

    if (queryParams.language) {
      filtered = filtered.filter(
        (u) =>
          u?.activationDetails?.preferredMenuLanguage &&
          u.activationDetails.preferredMenuLanguage
            .toLowerCase()
            .includes(String(queryParams.language).toLowerCase())
      );
    }

    const sortField = queryParams.sortBy || "names";
    const sortDirection = queryParams.sortDirection || "asc";
    const sorted = sortArray(filtered, sortField, sortDirection);

    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    const result = paginateArray(sorted, page, limit);

    return { data: result.data, pagination: result.pagination };
  } catch (error) {
    console.error("Error in listTenantUsersService:", error);
    throw new Error("Failed to list tenant users: " + error.message);
  }
}

/**
 * Search tenant users with enhanced query capabilities
 */
export async function searchTenantUsersService(tenantId, queryParams = {}) {
  try {
    const users = (await listTenantUsers(tenantId)).map(sanitize);
    let results = users;

    if (queryParams.q || queryParams.search) {
      const term = queryParams.q || queryParams.search;
      const fields = [
        "names",
        "surname",
        "title",
        "activationDetails.phoneNumber",
        "activationDetails.preferredMenuLanguage",
        "created.by",
      ];
      results = searchInArray(results, term, fields);
    }

    if (queryParams.statusFilter) {
      const isActive =
        String(queryParams.statusFilter).toLowerCase() === "active";
      results = results.filter((u) => u?.account?.isActive?.value === isActive);
    }

    if (queryParams.languageFilter) {
      results = results.filter(
        (u) =>
          u?.activationDetails?.preferredMenuLanguage ===
          queryParams.languageFilter
      );
    }

    if (queryParams.createdAfter) {
      const after = new Date(queryParams.createdAfter);
      results = results.filter(
        (u) => u?.created?.when && new Date(u.created.when) > after
      );
    }

    if (queryParams.createdBefore) {
      const before = new Date(queryParams.createdBefore);
      results = results.filter(
        (u) => u?.created?.when && new Date(u.created.when) < before
      );
    }

    const sortField = queryParams.sortBy || "names";
    const sortDirection = queryParams.sortDirection || "asc";
    const sorted = sortArray(results, sortField, sortDirection);

    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    const result = paginateArray(sorted, page, limit);

    return {
      data: result.data,
      pagination: result.pagination,
      searchTerm: queryParams.q || queryParams.search,
    };
  } catch (error) {
    console.error("Error in searchTenantUsersService:", error);
    throw new Error("Failed to search tenant users: " + error.message);
  }
}

/**
 * Bulk operations for tenant users
 */
export async function bulkTenantUsersService(tenantId, operation, data = []) {
  try {
    const results = {
      operation,
      timestamp: new Date().toISOString(),
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [],
      data: [],
    };

    switch (String(operation).toLowerCase()) {
      case "create":
        for (const [index, payload] of data.entries()) {
          try {
            const created = await serviceCreateTenantUser(
              tenantId,
              payload,
              "bulk_operation"
            );
            results.successful++;
            results.data.push({
              index,
              id: created.id,
              status: "created",
              data: created,
            });
          } catch (err) {
            results.failed++;
            results.errors.push({ index, error: err.message, data: payload });
          }
          results.processed++;
        }
        break;
      case "update":
        for (const [index, payload] of data.entries()) {
          try {
            const id = payload?.id;
            if (!id) throw new Error("ID is required for update operation");
            const updated = await serviceUpdateTenantUser(
              tenantId,
              id,
              payload
            );
            results.successful++;
            results.data.push({ index, id, status: "updated", data: updated });
          } catch (err) {
            results.failed++;
            results.errors.push({ index, error: err.message, data: payload });
          }
          results.processed++;
        }
        break;
      case "delete":
        for (const [index, item] of data.entries()) {
          try {
            const id = typeof item === "string" ? item : item?.id;
            if (!id) throw new Error("ID is required for delete operation");
            await serviceDeleteTenantUser(tenantId, id);
            results.successful++;
            results.data.push({ index, id, status: "deleted" });
          } catch (err) {
            results.failed++;
            results.errors.push({ index, error: err.message, data: item });
          }
          results.processed++;
        }
        break;
      default:
        throw new Error(`Unsupported bulk operation: ${operation}`);
    }

    results.success = results.failed === 0;
    return results;
  } catch (error) {
    console.error("Error in bulkTenantUsersService:", error);
    throw new Error("Bulk operation failed: " + error.message);
  }
}

/**
 * Export tenant users
 */
export async function exportTenantUsersService(
  tenantId,
  format = "json",
  queryParams = {}
) {
  try {
    const { data } = await listTenantUsersService(tenantId, queryParams);
    let payload, mimeType, filename;

    switch (String(format).toLowerCase()) {
      case "csv":
        payload = generateCSV(data, [
          "id",
          "title",
          "names",
          "surname",
          "activationDetails.phoneNumber",
          "activationDetails.preferredMenuLanguage",
          "account.isActive.value",
          "created.by",
          "created.when",
        ]);
        mimeType = "text/csv";
        filename = `tenant_users_export_${tenantId}_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        break;
      case "json":
      default:
        payload = generateJSON(data);
        mimeType = "application/json";
        filename = `tenant_users_export_${tenantId}_${
          new Date().toISOString().split("T")[0]
        }.json`;
        break;
    }

    return { data: payload, mimeType, filename, recordCount: data.length };
  } catch (error) {
    console.error("Error in exportTenantUsersService:", error);
    throw new Error("Export failed: " + error.message);
  }
}

/**
 * Stats for tenant users
 */
export async function getTenantUsersStatsService(tenantId) {
  try {
    const users = (await listTenantUsers(tenantId)).map(sanitize);
    const basic = generateStats(users, [
      "title",
      "activationDetails.preferredMenuLanguage",
      "account.isActive.value",
    ]);

    const insights = {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u?.account?.isActive?.value === true)
        .length,
      inactiveUsers: users.filter((u) => u?.account?.isActive?.value === false)
        .length,
      languages: [
        ...new Set(
          users
            .map((u) => u?.activationDetails?.preferredMenuLanguage)
            .filter(Boolean)
        ),
      ],
      recentlyCreated: users.filter((u) => {
        const when = u?.created?.when;
        if (!when) return false;
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(when) > cutoff;
      }).length,
    };

    return { ...basic, insights, generatedAt: new Date().toISOString() };
  } catch (error) {
    console.error("Error in getTenantUsersStatsService:", error);
    throw new Error("Failed to generate statistics: " + error.message);
  }
}
