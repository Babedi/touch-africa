import jwt from "jsonwebtoken";
import {
  ExternalAdminSchema,
  ExternalAdminUpdateSchema,
  ExternalAdminLoginSchema,
} from "./admin.validation.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../../middleware/permission.middleware.js";
import {
  createExternalAdminService,
  getExternalAdminByIdService,
  updateExternalAdminByIdService,
  deleteExternalAdminByIdService,
  listExternalAdminsService,
  searchExternalAdminsService,
  bulkExternalAdminsService,
  exportExternalAdminsService,
  getExternalAdminsStatsService,
  loginExternalAdminService,
  activateExternalAdminService,
  deactivateExternalAdminService,
} from "./admin.service.js";
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  handleZodError,
} from "../../../../utilities/response.util.js";
import {
  formatPaginatedResponse,
  createExportResponse,
} from "../../../../utilities/query.util.js";
import { derivePermissionsFromRoles } from "../../../../utilities/permissions.util.js";
import { getPersonRecord } from "../person/person.service.js";

// Define authorization roles
// Permissions defined in route handlers directly
// Permissions defined in route handlers directly

// Create External admin
export const createExternalAdminHandler = async (req, res, next) => {
  try {
    // Extract tenantId from route parameters
    const { tenantId } = req.params;

    // Validate request body
    const validatedData = ExternalAdminSchema.parse(req.body);

    // Get actor from authenticated user
    const actor =
      req.admin?.id || req.user?.id || req.user?.email || "anonymous";

    // Create admin via service
    const createdAdmin = await createExternalAdminService(
      validatedData,
      actor,
      tenantId
    );

    return sendSuccess(res, createdAdmin, "Admin created successfully", 201);
  } catch (error) {
    if (error.name === "ZodError") {
      return handleZodError(res, error);
    }

    // Handle business logic validation errors as 400 Bad Request
    if (
      (error.message &&
        error.message.includes("Email address") &&
        error.message.includes("already assigned")) ||
      (error.message.includes("Person with ID") &&
        error.message.includes("already assigned")) ||
      error.message.includes("Password does not meet")
    ) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
        },
        status: "error",
      });
    }

    next(error);
  }
};

// Get current admin details (me endpoint)
export const getCurrentAdminHandler = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const adminId = req.admin?.id || req.user?.id;
    if (!adminId) {
      return sendUnauthorized(res, "Admin ID not found in token");
    }

    const admin = await getExternalAdminByIdService(adminId, tenantId);
    if (!admin) {
      return sendNotFound(res, "Admin");
    }

    // Attach minimal person info to avoid separate client permission for /External/persons/:id
    let personMinimal = null;
    let personFullName = null;
    try {
      if (admin?.personId) {
        const person = await getPersonRecord(admin.personId, adminId);
        if (person) {
          personMinimal = {
            id: person.id,
            firstName: person.firstName,
            surname: person.surname,
          };
          const fn = (person.firstName || "").trim();
          const sn = (person.surname || "").trim();
          personFullName = [fn, sn].filter(Boolean).join(" ").trim() || null;
        }
      }
    } catch (e) {
      // Non-fatal: still return admin
    }

    return sendSuccess(
      res,
      { ...admin, person: personMinimal, personFullName },
      "Admin details retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Get External admin by ID
export const getExternalAdminByIdHandler = async (req, res, next) => {
  try {
    const { id, tenantId } = req.params;
    const admin = await getExternalAdminByIdService(id, tenantId);

    if (!admin) {
      return sendNotFound(res, "Admin", id);
    }

    return sendSuccess(res, admin, "Admin retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// Update External admin by ID
export const updateExternalAdminByIdHandler = async (req, res, next) => {
  try {
    const { id, tenantId } = req.params;

    // Validate request body
    const validatedData = ExternalAdminUpdateSchema.parse(req.body);

    // Get actor from authenticated user
    const actor =
      req.admin?.id || req.user?.id || req.user?.email || "anonymous";

    // Update admin via service
    const updatedAdmin = await updateExternalAdminByIdService(
      id,
      validatedData,
      actor,
      tenantId
    );

    return sendSuccess(res, updatedAdmin, "Admin updated successfully");
  } catch (error) {
    if (error.name === "ZodError") {
      return handleZodError(res, error);
    }

    // Handle business logic validation errors as 400 Bad Request
    if (
      (error.message &&
        error.message.includes("Email address") &&
        error.message.includes("already assigned")) ||
      (error.message.includes("Person with ID") &&
        error.message.includes("already assigned")) ||
      error.message.includes("Password does not meet") ||
      error.message.includes("Root admin can only be modified")
    ) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
        },
        status: "error",
      });
    }

    next(error);
  }
};

// Delete External admin by ID
export const deleteExternalAdminByIdHandler = async (req, res, next) => {
  try {
    const { id, tenantId } = req.params;

    // Get actor from authenticated user
    const actor =
      req.admin?.id || req.user?.id || req.user?.email || "anonymous";

    await deleteExternalAdminByIdService(id, actor, tenantId);

    return sendSuccess(res, null, "Admin deleted successfully");
  } catch (error) {
    next(error);
  }
};

// List all External admins
export const listExternalAdminsHandler = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const result = await listExternalAdminsService(req.parsedQuery, tenantId);

    // Format paginated response
    const formattedResponse = formatPaginatedResponse(
      result.data,
      result.pagination,
      req.parsedQuery
    );

    return sendSuccess(res, formattedResponse, "Admins retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// Search External admins
export const searchExternalAdminsHandler = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const result = await searchExternalAdminsService(req.parsedQuery, tenantId);

    // Format paginated response
    const formattedResponse = formatPaginatedResponse(
      result.data,
      result.pagination,
      req.parsedQuery
    );

    return sendSuccess(
      res,
      formattedResponse,
      "Admin search completed successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Bulk operations for External admins
export const bulkExternalAdminsHandler = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { operation, data, filters } = req.body;

    // Get actor from authenticated user
    const actor =
      req.admin?.id || req.user?.id || req.user?.email || "anonymous";

    const result = await bulkExternalAdminsService(
      operation,
      data,
      filters,
      actor,
      tenantId
    );

    return sendSuccess(res, result, `Bulk ${operation} completed successfully`);
  } catch (error) {
    next(error);
  }
};

// Export External admins
export const exportExternalAdminsHandler = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { format = "csv" } = req.query;
    // exportExternalAdminsService expects (queryParams, format, tenantId) per service signature
    const result = await exportExternalAdminsService(
      req.parsedQuery,
      format,
      tenantId
    );

    // Create export response
    const exportResponse = createExportResponse(result.data, format, "admins");

    res.setHeader("Content-Type", exportResponse.contentType);
    res.setHeader("Content-Disposition", exportResponse.disposition);

    return res.send(exportResponse.content);
  } catch (error) {
    next(error);
  }
};

// Get External admins statistics
export const getExternalAdminsStatsHandler = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const stats = await getExternalAdminsStatsService(
      req.parsedQuery,
      tenantId
    );

    return sendSuccess(res, stats, "Admin statistics retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// Login External admin
export const loginExternalAdminHandler = async (req, res, next) => {
  try {
    // Extract tenantId from route parameters
    const { tenantId } = req.params;

    // Validate request body
    const { email, password } = ExternalAdminLoginSchema.parse(req.body);

    // Authenticate admin
    const admin = await loginExternalAdminService(email, password, tenantId);

    // Strict RBAC: roles are only containers -> derive concrete permissions now
    const roleList = Array.isArray(admin.roles) ? admin.roles : [];
    const derivedPermissions = await derivePermissionsFromRoles(roleList);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.accessDetails.email,
        roles: admin.roles,
        permissions: derivedPermissions,
        type: "External_admin",
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Note: Attempting server-side cookie setting (currently not working due to Express middleware issue)
    // Client-side fallback implemented in frontend
    res.cookie("authToken", token, {
      httpOnly: false, // Temporarily set to false for debugging
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    return sendSuccess(
      res,
      { admin: { ...admin, permissions: derivedPermissions }, token },
      "Login successful"
    );
  } catch (error) {
    if (error.name === "ZodError") {
      return handleZodError(res, error);
    }

    if (
      error.message === "Invalid credentials" ||
      error.message === "Account is not active"
    ) {
      return sendUnauthorized(res, error.message);
    }

    next(error);
  }
};

// Logout External admin
export const logoutExternalAdminHandler = async (req, res) => {
  // Clear authentication cookie
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  // For JWT tokens, logout is also handled client-side
  // by removing the token from storage
  return sendSuccess(res, null, "Logged out successfully");
};

// Activate External admin
export const activateExternalAdminHandler = async (req, res, next) => {
  try {
    const { id, tenantId } = req.params;

    // Get actor from authenticated user
    const actor =
      req.admin?.id || req.user?.id || req.user?.email || "anonymous";

    const activatedAdmin = await activateExternalAdminService(
      id,
      actor,
      tenantId
    );

    return sendSuccess(res, activatedAdmin, "Admin activated successfully");
  } catch (error) {
    next(error);
  }
};

// Deactivate External admin
export const deactivateExternalAdminHandler = async (req, res, next) => {
  try {
    const { id, tenantId } = req.params;

    // Get actor from authenticated user
    const actor =
      req.admin?.id || req.user?.id || req.user?.email || "anonymous";

    const deactivatedAdmin = await deactivateExternalAdminService(
      id,
      actor,
      tenantId
    );

    return sendSuccess(res, deactivatedAdmin, "Admin deactivated successfully");
  } catch (error) {
    next(error);
  }
};

// PATCH External admin by ID (partial update)
export const patchExternalAdminByIdHandler = async (req, res, next) => {
  try {
    const { id, tenantId } = req.params;

    // Validate request body for partial update
    const validatedData = ExternalAdminUpdateSchema.partial().parse(req.body);

    // Get actor from authenticated user
    const actor =
      req.admin?.id || req.user?.id || req.user?.email || "anonymous";

    // Update admin via service
    const updatedAdmin = await updateExternalAdminByIdService(
      id,
      validatedData,
      actor,
      tenantId
    );

    return sendSuccess(
      res,
      updatedAdmin,
      "Admin partially updated successfully"
    );
  } catch (error) {
    if (error.name === "ZodError") {
      return handleZodError(res, error);
    }

    // Handle business logic validation errors as 400 Bad Request
    if (
      (error.message &&
        error.message.includes("Email address") &&
        error.message.includes("already assigned")) ||
      (error.message.includes("Person with ID") &&
        error.message.includes("already assigned")) ||
      error.message.includes("Password does not meet") ||
      error.message.includes("Root admin can only be modified")
    ) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
        },
        status: "error",
      });
    }

    next(error);
  }
};
