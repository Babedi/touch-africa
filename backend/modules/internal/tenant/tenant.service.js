import {
  TenantSchema,
  TenantUpdateSchema,
  newTenantId,
} from "./tenant.validation.js";
import {
  createTenant,
  getTenantById,
  updateTenantById,
  deleteTenantById,
  listTenants,
} from "./tenant.firestore.js";
import { db } from "../../../services/firestore.client.js";
// Copy helpers will use external tenant Firestore modules for writes
import { createExternalPermission } from "../../external/tenant/permission/permission.firestore.js";
import { createExternalRole } from "../../external/tenant/role/role.firestore.js";
import {
  buildFirestoreQuery,
  applySearch,
  applyFieldSelection,
  createPaginationMeta,
  convertToCSV,
  convertToJSON,
} from "../../../utilities/query.util.js";

function sanitize(x) {
  return x; // nothing sensitive in tenant at present
}

export async function serviceCreateTenant(payload, actor = "system") {
  const parsed = TenantSchema.parse(payload);

  const id = newTenantId();
  const model = {
    id,
    ...parsed,
    created: { by: actor, when: new Date().toISOString() },
    // Ensure account structure with defaults from schema
    account: parsed.account || { isActive: { value: true, changes: [] } },
  };
  const saved = await createTenant(model);
  return sanitize(saved);
}

/**
 * Copy all standard permissions and roles into a tenant's collections.
 * - Reads from standard collections (do not modify paths)
 * - Writes to tenant-specific collections using external modules
 */
export async function copyStandardPermissionsAndRolesToTenant(
  tenantId,
  actor = "system"
) {
  if (!tenantId)
    throw new Error("Tenant ID is required to copy permissions/roles");

  const now = new Date().toISOString();

  // Firestore collection paths (must match existing modules; do not change)
  const STANDARD_PERMISSIONS_PATH =
    "touchAfrica/southAfrica/standardPermissions";
  const STANDARD_ROLES_PATH = "touchAfrica/southAfrica/standardRoles";

  // 1) Copy Standard Permissions -> Tenant Permissions
  const stdPermSnapshot = await db.collection(STANDARD_PERMISSIONS_PATH).get();
  const permWrites = [];
  stdPermSnapshot.forEach((doc) => {
    const data = doc.data() || {};
    // Preserve the original permissionId (copy semantics)
    const permissionId = doc.id;
    const externalPermission = {
      permissionId,
      module: data.module,
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
      description: data.description,
      created: { by: actor, when: now },
      updated: { by: actor, when: now },
    };
    permWrites.push(createExternalPermission(externalPermission, tenantId));
  });

  // 2) Copy Standard Roles -> Tenant Roles
  const stdRoleSnapshot = await db.collection(STANDARD_ROLES_PATH).get();
  const roleWrites = [];
  stdRoleSnapshot.forEach((doc) => {
    const data = doc.data() || {};
    const roleId = doc.id; // preserve original id
    const externalRole = {
      roleId,
      roleName: data.roleName,
      roleCode: data.roleCode,
      description: data.description,
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
      isSystem: !!data.isSystem,
      isActive: data.isActive !== undefined ? !!data.isActive : true,
      priority: typeof data.priority === "number" ? data.priority : 50,
      created: { by: actor, when: now },
      updated: { by: actor, when: now },
    };
    roleWrites.push(createExternalRole(externalRole, roleId, tenantId));
  });

  // Execute writes in parallel
  await Promise.all([...permWrites, ...roleWrites]);

  return {
    permissionsCopied: permWrites.length,
    rolesCopied: roleWrites.length,
  };
}

export async function serviceGetTenantById(id) {
  const data = await getTenantById(id);
  return data ? sanitize(data) : null;
}

export async function serviceListTenants(queryParams = {}) {
  try {
    console.log("🏢 serviceListTenants called with queryParams:", queryParams);

    // Parse query parameters to ensure proper structure for pagination
    const parsedParams = {
      page: parseInt(queryParams.page) || 1,
      limit: parseInt(queryParams.limit) || 20,
      q: queryParams.q || "",
      search: queryParams.search,
      searchFields: queryParams.searchFields,
      fields: queryParams.fields,
      exclude: queryParams.exclude,
      pagination: {
        page: parseInt(queryParams.page) || 1,
        limit: parseInt(queryParams.limit) || 20,
      },
    };

    console.log("🔧 Parsed params for pagination:", parsedParams);

    // Directly query the collection
    const collection = db.collection("touchAfrica/southAfrica/tenants");
    const snapshot = await collection.get();

    let tenants = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    console.log(`📊 Found ${tenants.length} total tenants before filtering`);

    // Apply search if specified
    const searchQuery = queryParams.search?.query || queryParams.q;
    console.log(`🔍 Search query detected: "${searchQuery}"`);
    console.log(`🔍 Full search object:`, queryParams.search);
    if (searchQuery) {
      const searchFields = queryParams.search?.fields ||
        queryParams.searchFields || [
          "name", // Primary field
          "title",
          "slug",
          "contact.email",
          "contact.phoneNumber",
          "contactEmail",
          "contactPhone",
          "email",
          "phone",
          "address.locality",
          "address.city",
          "address.province",
          "activationResponseBlockName",
          "description",
        ];

      console.log(`🔍 Search fields:`, searchFields);
      console.log(`🔍 Total tenants before search: ${tenants.length}`);

      // Fix: applySearch expects a searchParams object with query and fields properties
      const searchParams = {
        query: searchQuery,
        fields: searchFields,
        type: "contains", // Default search type
      };
      console.log(`🔍 Search params:`, searchParams);

      tenants = applySearch(tenants, searchParams);
      console.log(`🔍 After search filtering: ${tenants.length} tenants found`);
    } else {
      console.log(`🔍 No search query provided`);
    }

    // Apply field selection
    if (queryParams.fields || queryParams.exclude) {
      tenants = applyFieldSelection(tenants, queryParams);
    }

    // Add isActive flag for compatibility
    tenants = tenants.map((t) => ({
      ...t,
      isActive: !!t?.account?.isActive?.value,
    }));

    // Apply sanitization
    tenants = tenants.map(sanitize);

    // Create pagination metadata using the EXACT same pattern as person service
    const pagination = createPaginationMeta(tenants.length, queryParams);
    console.log("📊 Generated pagination metadata:", pagination);

    // Apply pagination to results
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const paginatedTenants = tenants.slice(startIndex, endIndex);

    console.log(
      `✅ Returning ${paginatedTenants.length} tenants (page ${pagination.page} of ${pagination.pages})`
    );

    return {
      data: paginatedTenants,
      pagination,
    };
  } catch (error) {
    console.error("❌ Error in serviceListTenants:", error);
    throw error;
  }
}

// Search tenants service
export async function serviceSearchTenants(queryParams = {}) {
  try {
    console.log("🔍 serviceSearchTenants called with params:", queryParams);

    // Force search mode with correct field names for tenant schema
    const searchParams = {
      ...queryParams,
      q: queryParams.q || "",
      searchFields: queryParams.searchFields || [
        // Main tenant fields
        "name",
        "title",
        "slug",
        // Contact fields (if they exist)
        "contact.email",
        "contact.phoneNumber",
        "contactEmail",
        "contactPhone",
        "email",
        "phone",
        // Address fields (if they exist)
        "address.locality",
        "address.city",
        "address.province",
        // Other potential fields
        "activationResponseBlockName",
        "description",
      ],
    };

    console.log("🔍 Search params:", searchParams);
    return await serviceListTenants(searchParams);
  } catch (error) {
    console.error("Error in serviceSearchTenants:", error);
    throw error;
  }
}

// Bulk operations service
export async function serviceBulkTenants(operation, data, filters, actor) {
  try {
    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    switch (operation) {
      case "create":
        if (!Array.isArray(data)) {
          throw new Error("Data must be an array for bulk create");
        }

        for (const tenantData of data) {
          try {
            await serviceCreateTenant(tenantData, actor);
            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push({ data: tenantData, error: error.message });
          }
        }
        break;

      case "update":
        if (!Array.isArray(data)) {
          throw new Error("Data must be an array for bulk update");
        }

        for (const { id, ...updateData } of data) {
          try {
            await serviceUpdateTenant(id, updateData);
            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push({ id, error: error.message });
          }
        }
        break;

      case "delete":
        const idsToDelete = Array.isArray(data) ? data : data.ids;

        for (const id of idsToDelete) {
          try {
            await serviceDeleteTenant(id);
            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push({ id, error: error.message });
          }
        }
        break;

      case "activate":
        const idsToActivate = Array.isArray(data) ? data : data.ids;

        for (const id of idsToActivate) {
          try {
            await serviceActivateTenant(id, actor);
            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push({ id, error: error.message });
          }
        }
        break;

      case "deactivate":
        const idsToDeactivate = Array.isArray(data) ? data : data.ids;

        for (const id of idsToDeactivate) {
          try {
            await serviceDeactivateTenant(id, actor);
            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push({ id, error: error.message });
          }
        }
        break;

      default:
        throw new Error(`Unsupported bulk operation: ${operation}`);
    }

    return results;
  } catch (error) {
    console.error("Error in serviceBulkTenants:", error);
    throw error;
  }
}

// Export tenants service
export async function serviceExportTenants(queryParams = {}, format = "csv") {
  try {
    // Get all tenants without pagination for export
    const exportParams = {
      ...queryParams,
      limit: 10000, // High limit for export
      page: 1,
    };

    const result = await serviceListTenants(exportParams);

    // Convert based on format
    let content;
    let contentType;
    let filename;

    switch (format.toLowerCase()) {
      case "csv":
        content = convertToCSV(result.data);
        contentType = "text/csv";
        filename = `tenants_${new Date().toISOString().split("T")[0]}.csv`;
        break;

      case "json":
        content = convertToJSON(result.data);
        contentType = "application/json";
        filename = `tenants_${new Date().toISOString().split("T")[0]}.json`;
        break;

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    return {
      data: result.data,
      content,
      contentType,
      filename,
    };
  } catch (error) {
    console.error("Error in serviceExportTenants:", error);
    throw error;
  }
}

// Get tenants statistics service
export async function serviceGetTenantsStats(queryParams = {}) {
  try {
    const result = await serviceListTenants({ ...queryParams, limit: 10000 });
    const tenants = result.data;

    const stats = {
      total: tenants.length,
      active: tenants.filter((tenant) => {
        // Handle both old and new data structures
        if (tenant.account?.isActive?.value !== undefined) {
          return tenant.account.isActive.value === true;
        }
        // Fallback to old structure or default to true if no explicit inactive flag
        return tenant.isActive !== false;
      }).length,
      inactive: tenants.filter((tenant) => {
        // Handle both old and new data structures
        if (tenant.account?.isActive?.value !== undefined) {
          return tenant.account.isActive.value === false;
        }
        // Fallback to old structure
        return tenant.isActive === false;
      }).length,
      byProvince: {},
      companiesWithTradingNames: tenants.filter(
        (tenant) =>
          tenant.companyInfo?.tradingName &&
          tenant.companyInfo?.tradingName !== tenant.companyInfo?.companyName
      ).length,
      createdThisMonth: tenants.filter((tenant) => {
        const created = new Date(tenant.created?.when);
        const thisMonth = new Date();
        thisMonth.setDate(1);
        return created >= thisMonth;
      }).length,
      averageContactsPerTenant:
        tenants.reduce((sum, tenant) => {
          const contactCount =
            (tenant.contactInfo?.additionalContacts?.length || 0) + 1; // +1 for primary contact
          return sum + contactCount;
        }, 0) / tenants.length || 0,
    };

    // Calculate province distribution
    tenants.forEach((tenant) => {
      const province = tenant.address?.province || "Unknown";
      stats.byProvince[province] = (stats.byProvince[province] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error("Error in serviceGetTenantsStats:", error);
    throw error;
  }
}

export async function serviceUpdateTenant(id, patch) {
  console.log("🔄 serviceUpdateTenant called with:", { id, patch });

  // Get current tenant data for merging
  const current = await serviceGetTenantById(id);
  if (!current) {
    const err = new Error("Tenant not found");
    err.status = 404;
    throw err;
  }

  // Handle partial contact updates by merging with existing contact data
  if (patch.contact && current.contact) {
    patch.contact = {
      ...current.contact,
      ...patch.contact,
    };
  }

  console.log("🔄 Merged patch:", patch);

  const parsed = TenantUpdateSchema.parse(patch);
  console.log("✅ Validation passed, updating tenant");

  await updateTenantById(id, parsed);
  return await serviceGetTenantById(id);
}

export async function serviceDeleteTenant(id) {
  await deleteTenantById(id);
}

// Activate a tenant (toggle account.isActive and append change history)
export async function serviceActivateTenant(id, actor = "system") {
  const current = await getTenantById(id);
  if (!current) {
    const err = new Error("Tenant not found");
    err.status = 404;
    throw err;
  }
  const change = {
    by: actor,
    when: new Date().toISOString(),
    action: "activated",
  };
  const account = {
    isActive: {
      value: true,
      changes: [
        ...(((current.account || {}).isActive || {}).changes || []),
        change,
      ],
    },
  };
  await updateTenantById(id, { account });
  return await serviceGetTenantById(id);
}

// Deactivate a tenant (toggle account.isActive and append change history)
export async function serviceDeactivateTenant(id, actor = "system") {
  const current = await getTenantById(id);
  if (!current) {
    const err = new Error("Tenant not found");
    err.status = 404;
    throw err;
  }
  // Prevent deactivation of special/root tenants if needed (future rule)
  const change = {
    by: actor,
    when: new Date().toISOString(),
    action: "deactivated",
  };
  const account = {
    isActive: {
      value: false,
      changes: [
        ...(((current.account || {}).isActive || {}).changes || []),
        change,
      ],
    },
  };
  await updateTenantById(id, { account });
  return await serviceGetTenantById(id);
}

// Public service: list tenant names only (no auth required via route)
export async function serviceGetTenantNames() {
  // Directly query the collection for minimal data and build names list
  const collection = db.collection("touchAfrica/southAfrica/tenants");
  const snapshot = await collection.get();

  const names = [];
  snapshot.forEach((doc) => {
    const data = doc.data() || {};
    // Prefer explicit name; fall back to common alternatives if needed
    const name =
      (typeof data.name === "string" && data.name.trim()) ||
      (typeof data.title === "string" && data.title.trim()) ||
      (typeof data.activationResponseBlockName === "string" &&
        data.activationResponseBlockName.trim()) ||
      (typeof data?.companyInfo?.companyName === "string" &&
        data.companyInfo.companyName.trim()) ||
      null;
    if (name) names.push(name);
  });

  // Unique + sorted list
  return [...new Set(names)].sort((a, b) => a.localeCompare(b));
}

// Public service: list minimal tenant info { id, name }
export async function serviceGetTenantMinimal() {
  const collection = db.collection("touchAfrica/southAfrica/tenants");
  const snapshot = await collection.get();

  const items = [];
  snapshot.forEach((doc) => {
    const data = doc.data() || {};
    const name =
      (typeof data.name === "string" && data.name.trim()) ||
      (typeof data.title === "string" && data.title.trim()) ||
      (typeof data.activationResponseBlockName === "string" &&
        data.activationResponseBlockName.trim()) ||
      (typeof data?.companyInfo?.companyName === "string" &&
        data.companyInfo.companyName.trim()) ||
      null;
    if (name) items.push({ id: doc.id, name });
  });

  // Sort by name for UX
  return items.sort((a, b) => a.name.localeCompare(b.name));
}
