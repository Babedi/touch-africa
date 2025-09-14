/**
 * Permission-Based Authorization Middleware (strict permissions only)
 * Uses module.action format exclusively (e.g., admin.create, role.read)
 *
 * Roles are treated strictly as containers of permissions elsewhere (e.g., at login).
 * This middleware consumes a list of concrete permissions already attached to the request
 * by the auth layer (JWT claims) and makes no role-based decisions.
 */

import { sendForbidden, sendError } from "../utilities/response.util.js";

// Helper: does a granted permission satisfy the required one (supports namespace wildcard 'module.*' and global '*')
function matchPermission(required, granted) {
  if (!required || !granted) return false;
  if (granted === "*" || granted === "all.access") return true; // allow global/well-known super permission
  if (required === granted) return true; // exact
  const dot = required.indexOf(".");
  if (dot > 0) {
    const ns = required.slice(0, dot);
    if (granted === `${ns}.*`) return true;
  }
  return false;
}

function normalizeRequired(requiredPermissions) {
  if (!requiredPermissions || requiredPermissions.length === 0) return [];
  return Array.isArray(requiredPermissions[0])
    ? requiredPermissions[0].filter(Boolean)
    : requiredPermissions.filter(Boolean);
}

function collectUserPermissions(req) {
  // Try common locations where auth may attach permissions
  const fromAdmin = Array.isArray(req.admin?.permissions)
    ? req.admin.permissions
    : [];
  const fromUser = Array.isArray(req.user?.permissions)
    ? req.user.permissions
    : [];
  const fromAuth = Array.isArray(req.auth?.permissions)
    ? req.auth.permissions
    : [];
  const fromClaim = Array.isArray(req.permissions) ? req.permissions : [];

  // Accept alternative claim names for compatibility if present
  const fromAlt1 = Array.isArray(req.admin?.perms) ? req.admin.perms : [];
  const fromAlt2 = Array.isArray(req.user?.perms) ? req.user.perms : [];

  const merged = new Set(
    [
      ...fromAdmin,
      ...fromUser,
      ...fromAuth,
      ...fromClaim,
      ...fromAlt1,
      ...fromAlt2,
    ].filter(Boolean)
  );
  return Array.from(merged);
}

/**
 * Check if user has required permission(s) - OR logic
 * User needs at least ONE of the specified permissions
 */
export function checkPermissions(...required) {
  const requiredPermissions = normalizeRequired(required);
  return async (req, res, next) => {
    try {
      const userPermissions = collectUserPermissions(req);
      req.permissions = userPermissions; // expose for downstream

      if (!userPermissions || userPermissions.length === 0) {
        return res.status(403).json({
          success: false,
          error: "Insufficient permissions",
          required: requiredPermissions,
        });
      }

      // Global shortcuts
      if (
        userPermissions.includes("*") ||
        userPermissions.includes("all.access")
      ) {
        return next();
      }

      // ANY logic
      const ok =
        requiredPermissions.length === 0
          ? true
          : requiredPermissions.some((reqp) =>
              userPermissions.some((g) => matchPermission(reqp, g))
            );

      if (!ok) {
        return res.status(403).json({
          success: false,
          error: "Insufficient permissions",
          required: requiredPermissions,
        });
      }
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to verify permissions" });
    }
  };
}

/**
 * Check if user has ALL required permissions - AND logic
 * User needs ALL of the specified permissions
 */
export function checkAllPermissions(...required) {
  const requiredPermissions = normalizeRequired(required);
  return async (req, res, next) => {
    try {
      const userPermissions = collectUserPermissions(req);
      req.permissions = userPermissions;

      if (!userPermissions || userPermissions.length === 0) {
        return sendForbidden(
          res,
          "Access denied: You do not have any permissions assigned to your account. Please contact your administrator to have the necessary permissions granted."
        );
      }

      if (
        userPermissions.includes("*") ||
        userPermissions.includes("all.access")
      ) {
        return next();
      }

      // AND logic
      const missing = requiredPermissions.filter(
        (reqp) => !userPermissions.some((g) => matchPermission(reqp, g))
      );

      if (missing.length) {
        const missingPermissionsText = missing.join(", ");
        const requiredPermissionsText = requiredPermissions.join(", ");

        return res.status(403).json({
          error: {
            code: "INSUFFICIENT_PERMISSIONS",
            message: `Access denied: You do not have the required permissions to perform this action.`,
            details: {
              required: requiredPermissionsText,
              missing: missingPermissionsText,
              suggestion:
                "Please contact your administrator to request the necessary permissions.",
            },
          },
          status: "error",
        });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return sendError(
        res,
        "PERMISSION_CHECK_FAILED",
        "Failed to verify permissions due to a system error. Please try again.",
        {
          suggestion:
            "If the problem persists, please contact technical support.",
        },
        500
      );
    }
  };
}

export default {
  checkPermissions,
  checkAllPermissions,
};
