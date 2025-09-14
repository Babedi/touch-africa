import { z } from "zod";
import { generateToken } from "../../../utilities/auth.util.js";
import { derivePermissionsFromRoles } from "../../../utilities/permissions.util.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../middleware/permission.middleware.js";
import {
  serviceCreateTenantUser,
  serviceGetTenantUserById,
  serviceListTenantUsers,
  serviceUpdateTenantUser,
  serviceDeleteTenantUser,
  listTenantUsersService,
  searchTenantUsersService,
  bulkTenantUsersService,
  exportTenantUsersService,
  getTenantUsersStatsService,
} from "./tenant.user.service.js";
import { serviceListTenants } from "../../internal/tenant/tenant.service.js";

// Permissions defined in route handlers directly

// Login schema for validation
const TenantUserLoginSchema = z.object({
  tenantName: z.string().min(1, "Tenant name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  pin: z.string().length(4, "PIN must be exactly 4 digits"),
});

// Login handler for tenant user
export async function loginTenantUserHandler(req, res) {
  try {
    console.log("👤 Tenant User Login Request:", req.body);

    // Validate request body
    const { tenantName, phoneNumber, pin } = TenantUserLoginSchema.parse(
      req.body
    );

    console.log("✅ Schema validation passed");

    // Normalize phone number to ensure it starts with +27
    let normalizedPhoneNumber = phoneNumber;
    if (!phoneNumber.startsWith("+")) {
      if (phoneNumber.startsWith("27")) {
        normalizedPhoneNumber = "+" + phoneNumber;
      } else if (phoneNumber.startsWith("0")) {
        // Convert 0812345678 to +27812345678
        normalizedPhoneNumber = "+27" + phoneNumber.substring(1);
      } else {
        // Assume it's a South African number without country code
        normalizedPhoneNumber = "+27" + phoneNumber;
      }
    }

    console.log(
      `📱 Phone number normalized: ${phoneNumber} → ${normalizedPhoneNumber}`
    );

    // Find tenant by name
    const tenants = await serviceListTenants();
    console.log(`📋 Found ${tenants.length} tenants`);

    let tenant = tenants.find(
      (t) =>
        t.activationResponseBlockName?.toLowerCase() ===
          tenantName.toLowerCase() ||
        t.id?.toLowerCase().includes(tenantName.toLowerCase()) ||
        t.address?.locality?.toLowerCase().includes(tenantName.toLowerCase())
    );

    if (!tenant) {
      console.log("❌ Tenant not found for:", tenantName);
      return res.status(401).json({
        success: false,
        error: "Invalid credentials - tenant not found",
      });
    }

    console.log("✅ Tenant found:", tenant.id);

    // Look up actual tenant user by phone number and validate PIN
    const tenantUsers = await serviceListTenantUsers(tenant.id);
    console.log(
      `📋 Found ${tenantUsers.length} tenant users for tenant ${tenant.id}`
    );

    const matchingUser = tenantUsers.find(
      (user) =>
        user.activationDetails?.phoneNumber === normalizedPhoneNumber &&
        user.activationDetails?.pin === pin &&
        user.account?.isActive?.value === true
    );

    // Debug: Log search details
    console.log(
      `🔍 DEBUG: Looking for user with normalized phone: ${normalizedPhoneNumber}, original: ${phoneNumber}, PIN: ${pin}`
    );
    console.log(`🔍 DEBUG: Existing tenant users:`);
    tenantUsers.forEach((user, index) => {
      console.log(
        `   ${index + 1}. ID: ${user.id}, Phone: ${
          user.activationDetails?.phoneNumber
        }, Active: ${user.account?.isActive?.value}`
      );
    });

    let finalMatchingUser = matchingUser;

    if (!finalMatchingUser) {
      console.log("❌ No matching active user found for credentials");
      return res.status(401).json({
        success: false,
        error: "Invalid credentials - user not found or inactive",
      });
    }

    console.log("✅ User authenticated:", finalMatchingUser.id);

    const tenantUserData = {
      id: finalMatchingUser.id,
      phoneNumber: finalMatchingUser.activationDetails.phoneNumber,
      tenantId: tenant.id,
      tenantName: tenantName,
      roles: ["tenantUser"],
      // permissions will be derived from roles below
      // Include user profile data for immediate use
      title: finalMatchingUser.title,
      names: finalMatchingUser.names,
      surname: finalMatchingUser.surname,
    };

    console.log("🔑 Authenticated tenant user data:", tenantUserData);

    // Derive permissions from roles and include in JWT
    const derivedPermissions = await derivePermissionsFromRoles(
      tenantUserData.roles
    );
    // Generate JWT token with real user ID
    const token = generateToken({
      id: finalMatchingUser.id, // Use real Firestore user ID
      phoneNumber: finalMatchingUser.activationDetails.phoneNumber,
      tenantId: tenant.id,
      roles: tenantUserData.roles,
      permissions: derivedPermissions,
      type: "tenantUser",
    });

    console.log("🎟️ Generated token length:", token.length);

    const response = {
      success: true,
      data: {
        user: { ...tenantUserData, permissions: derivedPermissions },
        token,
        tenantId: tenant.id,
      },
    };

    console.log("📤 Sending response:", JSON.stringify(response, null, 2));

    res.json(response);
  } catch (error) {
    if (error.name === "ZodError") {
      console.log("❌ Validation error:", error.errors);
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
    }

    console.error("❌ Tenant user login error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

// Permissions defined in route handlers directly

function actorFrom(req) {
  const p = req.admin || req.user || {};
  return p.id || p.email || "anonymous";
}

export async function createTenantUserHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"]; // enforce tenant scoping
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    const data = await serviceCreateTenantUser(
      tenantId,
      req.body,
      actorFrom(req)
    );
    res.status(201).json({ success: true, data });
  } catch (err) {
    if (err instanceof z.ZodError)
      return res
        .status(400)
        .json({ error: "ValidationError", details: err.errors });
    next(err);
  }
}

export async function getTenantUserByIdHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"];
    const id = req.params.id;
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    const data = await serviceGetTenantUserById(tenantId, id);
    if (!data) return res.status(404).json({ error: "NotFound" });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listTenantUsersHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"];
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    const result = await listTenantUsersService(tenantId, req.query);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Search tenant users with enhanced query capabilities
 * GET /external/tenant-user/search
 */
export async function searchTenantUsersHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"];
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    const result = await searchTenantUsersService(tenantId, req.query);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Bulk operations for tenant users
 * POST /external/tenant-user/bulk
 */
export async function bulkTenantUsersHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"];
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });

    const { operation, data } = req.body;
    if (!operation || !data) {
      return res
        .status(400)
        .json({ error: "Operation and data are required for bulk operations" });
    }

    const result = await bulkTenantUsersService(tenantId, operation, data);
    const statusCode = result.success ? 200 : 207; // 207 for partial success
    res.status(statusCode).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Export tenant users data
 * GET /external/tenant-user/export
 */
export async function exportTenantUsersHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"];
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });

    const { format = "json" } = req.query;
    const result = await exportTenantUsersService(tenantId, format, req.query);

    // Set appropriate headers for file download
    res.setHeader("Content-Type", result.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`
    );

    return res.send(result.data);
  } catch (err) {
    next(err);
  }
}

/**
 * Get tenant user statistics and analytics
 * GET /external/tenant-user/stats
 */
export async function getTenantUsersStatsHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"];
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });

    const stats = await getTenantUsersStatsService(tenantId);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}

export async function updateTenantUserHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"];
    const id = req.params.id;
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    let patch = req.body;
    // Activate/deactivate shortcuts
    if (req.path.includes("/activate/")) {
      patch = {
        account: {
          isActive: {
            value: true,
            changes: [{ when: new Date().toISOString(), value: true }],
          },
        },
      };
    } else if (req.path.includes("/deactivate/")) {
      patch = {
        account: {
          isActive: {
            value: false,
            changes: [{ when: new Date().toISOString(), value: false }],
          },
        },
      };
    }
    const data = await serviceUpdateTenantUser(tenantId, id, patch);
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof z.ZodError)
      return res
        .status(400)
        .json({ error: "ValidationError", details: err.errors });
    next(err);
  }
}

export async function deleteTenantUserHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"];
    const id = req.params.id;
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    await serviceDeleteTenantUser(tenantId, id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function patchTenantUserHandler(req, res, next) {
  try {
    const tenantId = req.headers["x-tenant-id"];
    const id = req.params.id;
    if (!tenantId) return res.status(400).json({ error: "MissingTenantId" });
    const data = await serviceUpdateTenantUser(tenantId, id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "BadRequest", details: err.errors });
    }
    next(err);
  }
}
