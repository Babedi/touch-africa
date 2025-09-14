import {
  verifyToken,
  extractTokenFromRequest,
} from "../utilities/auth-enhanced.util.js";

/**
 * Enhanced authentication middleware with better error handling and logging
 */
export function authenticateJWT(req, res, next) {
  try {
    // Extract token from request
    const token = extractTokenFromRequest(req);

    if (!token) {
      console.log(
        `Auth failed - No token provided: ${req.method} ${req.url} from ${req.ip}`
      );
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        message: "No authentication token provided",
        code: "NO_TOKEN",
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      tenantId: decoded.tenantId,
      sessionId: decoded.sessionId,
      jti: decoded.jti,
    };

    console.log(
      `Auth success - User: ${decoded.userId}, Role: ${decoded.role}, Path: ${req.url}`
    );
    next();
  } catch (error) {
    console.warn(
      `Auth failed - ${error.message}: ${req.method} ${req.url} from ${req.ip}`
    );

    let errorCode = "INVALID_TOKEN";
    let statusCode = 401;

    if (error.message === "Token expired") {
      errorCode = "TOKEN_EXPIRED";
    } else if (error.message === "Invalid token") {
      errorCode = "INVALID_TOKEN";
    }

    return res.status(statusCode).json({
      success: false,
      error: "Authentication failed",
      message: error.message,
      code: errorCode,
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token, but validates if present
 */
export function optionalAuth(req, res, next) {
  try {
    const token = extractTokenFromRequest(req);

    if (token) {
      const decoded = verifyToken(token);
      req.user = {
        userId: decoded.userId,
        role: decoded.role,
        tenantId: decoded.tenantId,
        sessionId: decoded.sessionId,
        jti: decoded.jti,
      };
    }

    next();
  } catch (error) {
    // Invalid token present - clear user and continue
    req.user = null;
    console.log(`Optional auth - Invalid token ignored: ${error.message}`);
    next();
  }
}

/**
 * Middleware to require specific user roles
 */
export function requireRoles(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        code: "NO_USER",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.warn(
        `Access denied - User: ${req.user.userId}, Role: ${
          req.user.role
        }, Required: ${allowedRoles.join("|")}, Path: ${req.url}`
      );
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions",
        message: `Required roles: ${allowedRoles.join(", ")}`,
        code: "INSUFFICIENT_PERMISSIONS",
      });
    }

    next();
  };
}

/**
 * Middleware to require tenant context
 */
export function requireTenantContext(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
      code: "NO_USER",
    });
  }

  if (!req.user.tenantId) {
    return res.status(403).json({
      success: false,
      error: "Tenant context required",
      code: "NO_TENANT_CONTEXT",
    });
  }

  next();
}

/**
 * Middleware to check tenant ownership
 */
export function requireTenantOwnership(req, res, next) {
  const tenantIdFromParams = req.params.tenantId;
  const tenantIdFromBody = req.body?.tenantId;
  const tenantIdFromQuery = req.query?.tenantId;

  const requestedTenantId =
    tenantIdFromParams || tenantIdFromBody || tenantIdFromQuery;

  if (!requestedTenantId) {
    return res.status(400).json({
      success: false,
      error: "Tenant ID required",
      code: "NO_TENANT_ID",
    });
  }

  // Root admins can access any tenant
  if (
    req.user.role === "internalRootAdmin" ||
    req.user.role === "internalSuperAdmin"
  ) {
    return next();
  }

  // Other users can only access their own tenant
  if (req.user.tenantId !== requestedTenantId) {
    console.warn(
      `Tenant access denied - User: ${req.user.userId}, UserTenant: ${req.user.tenantId}, RequestedTenant: ${requestedTenantId}`
    );
    return res.status(403).json({
      success: false,
      error: "Access denied to this tenant",
      code: "TENANT_ACCESS_DENIED",
    });
  }

  next();
}
