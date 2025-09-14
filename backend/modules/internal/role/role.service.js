/**
 * Internal Role Service
 * Business logic for internal role operations
 */

import {
  createInternalRole,
  getInternalRoleById,
  updateInternalRoleById,
  deleteInternalRoleById,
  getAllInternalRoles,
  roleCodeExists,
  COLLECTION_PATH,
} from "./role.firestore.js";
import { newInternalRoleId } from "./role.validation.js";
import { db } from "../../../services/firestore.client.js";
import {
  buildFirestoreQuery,
  applySearch,
  applySorting,
  applyFieldSelection,
  createPaginationMeta,
  convertToCSV,
  convertToJSON,
} from "../../../utilities/query.util.js";

/**
 * Create internal role service
 */
export async function createInternalRoleService(roleData, actor) {
  // Check if role code already exists
  const codeExists = await roleCodeExists(roleData.roleCode);
  if (codeExists) {
    throw new Error(
      `Role code '${roleData.roleCode}' already exists. Please choose a different role code.`
    );
  }

  const roleId = newInternalRoleId();

  const roleWithDefaults = {
    ...roleData,
    roleId,
  };

  return await createInternalRole(roleWithDefaults, roleId);
}

/**
 * Get internal role by ID service
 */
export async function getInternalRoleByIdService(roleId) {
  const role = await getInternalRoleById(roleId);
  if (!role) {
    throw new Error(`Internal role with ID ${roleId} not found`);
  }
  return role;
}

/**
 * Update internal role service
 */
export async function updateInternalRoleByIdService(roleId, updateData, actor) {
  const existingRole = await getInternalRoleById(roleId);
  if (!existingRole) {
    throw new Error(`Internal role with ID ${roleId} not found`);
  }

  if (existingRole.isSystem) {
    throw new Error("System roles cannot be modified");
  }

  // Preserve immutable fields regardless of what the frontend submits
  const { roleName: _rn, roleCode: _rc, isSystem: _is } = updateData || {};
  const updateWithMetadata = {
    ...updateData,
    roleName: existingRole.roleName,
    roleCode: existingRole.roleCode,
    isSystem: existingRole.isSystem === true, // always preserve system flag
  };

  return await updateInternalRoleById(roleId, updateWithMetadata);
}

/**
 * Delete internal role service
 */
export async function deleteInternalRoleByIdService(roleId) {
  const existingRole = await getInternalRoleById(roleId);
  if (!existingRole) {
    throw new Error(`Internal role with ID ${roleId} not found`);
  }

  if (existingRole.isSystem) {
    throw new Error("System roles cannot be deleted");
  }

  return await deleteInternalRoleById(roleId);
}

/**
 * List all internal roles service with comprehensive query support
 */
export async function listInternalRolesService(queryParams = {}) {
  const {
    page = 1,
    limit = 20,
    fields,
    sort = "createdAt",
    order = "desc",
  } = queryParams;

  // Get base query
  const query = buildFirestoreQuery(COLLECTION_PATH, {
    page,
    limit,
    sort,
    order,
    filters: queryParams.filters || {},
  });

  // Execute query and get total count
  const [querySnapshot, totalCountSnapshot] = await Promise.all([
    query.get(),
    db.collection(COLLECTION_PATH).get(),
  ]);

  let roles = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Apply search if provided
  if (queryParams.search) {
    roles = applySearch(roles, queryParams.search, [
      "roleName",
      "roleCode",
      "description",
    ]);
  }

  // Apply field selection
  if (fields) {
    roles = applyFieldSelection(roles, fields);
  }

  // Create pagination metadata
  const pagination = createPaginationMeta(
    page,
    limit,
    totalCountSnapshot.size,
    roles.length
  );

  return {
    data: roles,
    pagination,
  };
}

/**
 * Search internal roles service
 */
export async function searchInternalRolesService(queryParams = {}) {
  const { search, limit = 20, fields } = queryParams;

  if (!search) {
    return {
      data: [],
      pagination: createPaginationMeta(1, limit, 0, 0),
    };
  }

  // Get all roles for search
  const snapshot = await db.collection(COLLECTION_PATH).get();
  let roles = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Apply search
  roles = applySearch(roles, search, ["roleName", "roleCode", "description"]);

  // Limit results
  const limitedRoles = roles.slice(0, limit);

  // Apply field selection
  const finalRoles = fields
    ? applyFieldSelection(limitedRoles, fields)
    : limitedRoles;

  return {
    data: finalRoles,
    pagination: createPaginationMeta(
      1,
      limit,
      roles.length,
      limitedRoles.length
    ),
  };
}

/**
 * Bulk operations service for internal roles
 */
export async function bulkInternalRolesService(operation, data) {
  const results = [];
  const errors = [];

  try {
    switch (operation) {
      case "create":
        for (const roleData of data) {
          try {
            const result = await createInternalRoleService(roleData);
            results.push({ operation: "create", success: true, data: result });
          } catch (error) {
            errors.push({
              operation: "create",
              error: error.message,
              data: roleData,
            });
          }
        }
        break;

      case "update":
        for (const item of data) {
          try {
            const result = await updateInternalRoleByIdService(
              item.id,
              item.data
            );
            results.push({ operation: "update", success: true, data: result });
          } catch (error) {
            errors.push({
              operation: "update",
              error: error.message,
              data: item,
            });
          }
        }
        break;

      case "delete":
        for (const roleId of data) {
          try {
            await deleteInternalRoleByIdService(roleId);
            results.push({ operation: "delete", success: true, id: roleId });
          } catch (error) {
            errors.push({
              operation: "delete",
              error: error.message,
              id: roleId,
            });
          }
        }
        break;

      default:
        throw new Error(`Unsupported bulk operation: ${operation}`);
    }

    return {
      success: errors.length === 0,
      results,
      errors,
      summary: {
        total: results.length + errors.length,
        successful: results.length,
        failed: errors.length,
      },
    };
  } catch (error) {
    throw new Error(`Bulk operation failed: ${error.message}`);
  }
}

/**
 * Export internal roles service
 */
export async function exportInternalRolesService(
  format = "json",
  queryParams = {}
) {
  try {
    // Get roles using existing accessor to ensure correct collection path
    const { fields } = queryParams;
    const allRoles = await getAllInternalRoles(); // returns { roleId, ...data }

    // Normalize to have a stable id field for exports
    let roles = allRoles.map((r) => ({ id: r.roleId ?? r.id, ...r }));

    // Apply search if provided
    if (queryParams.search) {
      roles = applySearch(roles, queryParams.search, [
        "roleName",
        "roleCode",
        "description",
      ]);
    }

    // Apply sorting in-memory (avoid Firestore orderBy on dynamic fields)
    if (queryParams.sort) {
      roles = applySorting(roles, queryParams.sort);
    }

    // Apply field selection
    if (fields) {
      roles = applyFieldSelection(roles, fields);
    }

    // Convert to requested format
    let exportData;
    let mimeType;
    let fileExtension;

    switch (format.toLowerCase()) {
      case "csv":
        exportData = convertToCSV(roles);
        mimeType = "text/csv";
        fileExtension = "csv";
        break;
      case "json":
      default:
        exportData = convertToJSON(roles);
        mimeType = "application/json";
        fileExtension = "json";
        break;
    }

    return {
      data: exportData,
      mimeType,
      fileExtension,
      filename: `internal-roles-${
        new Date().toISOString().split("T")[0]
      }.${fileExtension}`,
      totalRecords: roles.length,
    };
  } catch (error) {
    throw new Error(`Export failed: ${error.message}`);
  }
}

/**
 * Get internal roles statistics service
 */
export async function getInternalRolesStatsService() {
  try {
    const snapshot = await db.collection(COLLECTION_PATH).get();
    const roles = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Basic statistics
    const stats = {
      total: roles.length,
      byStatus: {
        active: 0,
        inactive: 0,
      },
      byType: {
        standard: 0,
        custom: 0,
      },
      recentActivity: {
        createdThisMonth: 0,
        updatedThisMonth: 0,
      },
    };

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    roles.forEach((role) => {
      // Count by status
      const isActive =
        role.isActive ?? role.active ?? role.status === "active" ?? true;
      if (isActive !== false) {
        stats.byStatus.active++;
      } else {
        stats.byStatus.inactive++;
      }

      // Count by type (system vs custom)
      if (role.isSystem) stats.byType.standard++;
      else stats.byType.custom++;

      // Recent activity
      if (role.createdAt && new Date(role.createdAt) >= thisMonth) {
        stats.recentActivity.createdThisMonth++;
      }
      if (role.updatedAt && new Date(role.updatedAt) >= thisMonth) {
        stats.recentActivity.updatedThisMonth++;
      }
    });

    return stats;
  } catch (error) {
    throw new Error(`Failed to get roles statistics: ${error.message}`);
  }
}

/**
 * Original list function - kept for backward compatibility
 */
export async function listInternalRolesServiceOriginal() {
  return await getAllInternalRoles();
}

/**
 * Get permissions for a role
 */
export async function getRolePermissionsService(roleCode) {
  const roles = await getAllInternalRoles();
  const role = roles.find((r) => r.roleCode === roleCode);
  return role ? role.permissions : [];
}

/**
 * Check if role has permission
 */
export async function roleHasPermissionService(roleCode, permission) {
  const permissions = await getRolePermissionsService(roleCode);
  return permissions.includes(permission);
}
