/**
 * Permission-Based Authorization Middleware
 * Uses module.action format (e.g., admin.create, role.read)
 */

import { getRolePermissionsService } from "../../modules/internal/internal.role/internal.role.service.js";
import roleMappingConfig from "../../config/config/role-mappings.config.js";

// Initialize role mappings on middleware load
await roleMappingConfig.initialize();

/**
 * Cache for role permissions to reduce database calls
 */
const permissionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get permissions for a role with caching
 */
async function getCachedPermissions(roleCode) {
  const cacheKey = `permissions:${roleCode}`;
  const cached = permissionCache.get(cacheKey);

  if (cached && cached.expiry > Date.now()) {
    return cached.permissions;
  }

  const permissions = await getRolePermissionsService(roleCode);
  permissionCache.set(cacheKey, {
    permissions,
    expiry: Date.now() + CACHE_TTL,
  });

  return permissions;
}

/**
 * Clear permission cache for a role
 */
export function clearPermissionCache(roleCode = null) {
  if (roleCode) {
    permissionCache.delete(`permissions:${roleCode}`);
  } else {
    permissionCache.clear();
  }
  console.log("🔧 Permission cache cleared for:", roleCode || "ALL");
}

/**
 * Check if user has required permission(s) - OR logic
 * User needs at least ONE of the specified permissions
 */
export function checkPermissions(...requiredPermissions) {
  return async (req, res, next) => {
    try {
      console.log("🔍 DEBUG: Checking permissions:", requiredPermissions);

      if (!req.admin || !req.admin.roles) {
        console.error("❌ No admin or roles found in request");
        return res.status(403).json({
          success: false,
          message: "Access denied. No roles found.",
        });
      }

      // Get fresh mappings (in case they've been updated)
      const roleCodeMap = roleMappingConfig.getAllMappings();

      console.log(
        "🔍 DEBUG: Using role mappings from:",
        roleMappingConfig.getStatus().source
      );
      console.log("🔍 DEBUG: User roles array:", req.admin.roles);

      // Priority order for role selection (highest to lowest)
      const rolePriority = [
        "root",
        "internalRootAdmin",
        "internalSuperAdmin",
        "internalStandardAdmin",
        "externalSuperAdmin",
        "externalStandardAdmin",
        "tenantAdmin",
        "lookupManager",
        "tenantUser",
      ];

      console.log("🔍 DEBUG: Role priority array:", rolePriority);

      // Select the highest priority role the user has
      let userRole = null;
      for (const priorityRole of rolePriority) {
        if (req.admin.roles.includes(priorityRole)) {
          userRole = priorityRole;
          console.log("🔍 DEBUG: Found priority role:", userRole);
          break;
        }
      }

      // Fallback to first role if no priority role found
      if (!userRole) {
        userRole = req.admin.roles[0];
        console.log("🔍 DEBUG: Using fallback role:", userRole);
      }

      console.log("🔍 DEBUG: Selected role:", userRole);

      // Map the role to its database code using configurable mapping
      const roleCode = roleMappingConfig.getMapping(userRole) || userRole;
      console.log("🔍 DEBUG: Role mapping:", userRole, "->", roleCode);

      // Clear cache for fresh permission lookup
      clearPermissionCache(roleCode);

      // Fetch user permissions
      const userPermissions = await getCachedPermissions(roleCode);
      console.log("🔍 DEBUG: User permissions:", userPermissions);

      // Store in request for later use
      req.permissions = userPermissions;
      req.roleCode = roleCode;

      // Special case: all.access permission grants everything
      if (userPermissions.includes("all.access")) {
        return next();
      }

      // Check if user has ANY of the required permissions
      const hasPermission = requiredPermissions.some((permission) =>
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: `Insufficient permissions. Required: ${requiredPermissions.join(
            " OR "
          )}`,
          required: requiredPermissions,
          userPermissions: userPermissions,
        });
      }

      // Add permissions to request for later use
      req.permissions = userPermissions;
      req.roleCode = roleCode;

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to verify permissions",
      });
    }
  };
}

/**
 * Check if user has ALL required permissions - AND logic
 * User needs ALL of the specified permissions
 */
export function checkAllPermissions(...requiredPermissions) {
  return async (req, res, next) => {
    try {
      // Get user role from request
      let userRole = null;

      if (req.admin) {
        userRole = req.admin.role || req.admin.userRole;
      } else if (req.user) {
        userRole = req.user.role || req.user.userRole;
      } else if (req.tenantAdmin) {
        userRole = "TENANT_ADMIN";
      } else if (req.tenantUser) {
        userRole = "TENANT_USER";
      }

      if (!userRole) {
        return res.status(403).json({
          success: false,
          error: "No role information found",
        });
      }

      // Convert role to role code format
      const roleCodeMap = {
        internalRootAdmin: "INTERNAL_ROOT_ADMIN",
        internalSuperAdmin: "INTERNAL_SUPER_ADMIN",
        internalStandardAdmin: "INTERNAL_STANDARD_ADMIN",
        lookupManager: "LOOKUP_MANAGER",
        tenantAdmin: "TENANT_ADMIN",
        tenantUser: "TENANT_USER",
      };

      const roleCode = roleCodeMap[userRole] || userRole;

      // Get user permissions
      const userPermissions = await getCachedPermissions(roleCode);

      // Special case: all.access permission grants everything
      if (userPermissions.includes("all.access")) {
        req.permissions = userPermissions;
        req.roleCode = roleCode;
        return next();
      }

      // Check if user has ALL required permissions
      const hasAllPermissions = requiredPermissions.every((permission) =>
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        const missingPermissions = requiredPermissions.filter(
          (p) => !userPermissions.includes(p)
        );

        return res.status(403).json({
          success: false,
          error: `Missing required permissions: ${missingPermissions.join(
            ", "
          )}`,
          required: requiredPermissions,
          missing: missingPermissions,
          userPermissions: userPermissions,
        });
      }

      // Add permissions to request
      req.permissions = userPermissions;
      req.roleCode = roleCode;

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to verify permissions",
      });
    }
  };
}

/**
 * Legacy support - converts old authorize calls to permission-based
 */
export function authorize(...roles) {
  // Map old roles to module.action permissions
  const rolePermissionMap = {
    internalRootAdmin: ["all.access"],
    internalSuperAdmin: ["admin.manage"],
    internalStandardAdmin: ["admin.read"],
    lookupManager: ["lookup.manage"],
    tenantAdmin: ["tenant.manage"],
    tenantUser: ["user.read"],
  };

  // Get permissions for the roles
  const permissions = new Set();
  for (const role of roles) {
    const perms = rolePermissionMap[role];
    if (perms) {
      perms.forEach((p) => permissions.add(p));
    }
  }

  // If no permissions mapped, default to read
  if (permissions.size === 0) {
    permissions.add("admin.read");
  }

  return checkPermissions(...Array.from(permissions));
}

export default {
  checkPermissions,
  checkAllPermissions,
  authorize,
  clearPermissionCache,
};
