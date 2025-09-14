import jwt from "jsonwebtoken";
import {
  InternalAdminSchema,
  InternalAdminUpdateSchema,
  InternalAdminLoginSchema,
} from "./admin.validation.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../middleware/permission.middleware.js";
import {
  createInternalAdminService,
  getInternalAdminByIdService,
  updateInternalAdminByIdService,
  deleteInternalAdminByIdService,
  listInternalAdminsService,
  searchInternalAdminsService,
  bulkInternalAdminsService,
  exportInternalAdminsService,
  getInternalAdminsStatsService,
  loginInternalAdminService,
  activateInternalAdminService,
  deactivateInternalAdminService,
} from "./admin.service.js";
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  handleZodError,
} from "../../../utilities/response.util.js";
import {
  formatPaginatedResponse,
  createExportResponse,
} from "../../../utilities/query.util.js";
import { derivePermissionsFromRoles } from "../../../utilities/permissions.util.js";
import { getPersonRecord } from "../person/person.service.js";

// Define authorization roles
// Permissions defined in route handlers directly
// Permissions defined in route handlers directly

// Create internal admin
export const createInternalAdminHandler = async (req, res, next) => {
  try {
    // Validate request body
    const validatedData = InternalAdminSchema.parse(req.body);

    // Get actor from authenticated user
    const actor =
      req.admin?.id || req.user?.id || req.user?.email || "anonymous";

    // Create admin via service
    const createdAdmin = await createInternalAdminService(validatedData, actor);

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
    const adminId = req.admin?.id || req.user?.id;
    if (!adminId) {
      return sendUnauthorized(res, "Admin ID not found in token");
    }

    const admin = await getInternalAdminByIdService(adminId);
    if (!admin) {
      return sendNotFound(res, "Admin");
    }

    // Attach minimal person info to avoid separate client permission for /internal/persons/:id
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

// Get internal admin by ID
export const getInternalAdminByIdHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const admin = await getInternalAdminByIdService(id);

    if (!admin) {
      return sendNotFound(res, "Admin", id);
    }

    return sendSuccess(res, admin, "Admin retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// Update internal admin by ID
export const updateInternalAdminByIdHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate request body
    const validatedData = InternalAdminUpdateSchema.parse(req.body);

    // Get actor from authenticated user
    const actor =
      req.admin?.id || req.user?.id || req.user?.email || "anonymous";

    // Update admin via service
    const updatedAdmin = await updateInternalAdminByIdService(
      id,
      validatedData,
      actor
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

// Delete internal admin by ID
export const deleteInternalAdminByIdHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get actor from authenticated user
    const actor =
      req.admin?.id || req.user?.id || req.user?.email || "anonymous";

    await deleteInternalAdminByIdService(id, actor);

    return sendSuccess(res, null, "Admin deleted successfully");
  } catch (error) {
    next(error);
  }
};

// List all internal admins
export const listInternalAdminsHandler = async (req, res, next) => {
  try {
    const result = await listInternalAdminsService(req.parsedQuery);

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

// Search internal admins
export const searchInternalAdminsHandler = async (req, res, next) => {
  try {
    const result = await searchInternalAdminsService(req.parsedQuery);

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

// Bulk operations for internal admins
export const bulkInternalAdminsHandler = async (req, res, next) => {
  try {
    const { operation, data, filters } = req.body;

    // Get actor from authenticated user
    const actor =
      req.admin?.id || req.user?.id || req.user?.email || "anonymous";

    const result = await bulkInternalAdminsService(
      operation,
      data,
      filters,
      actor
    );

    return sendSuccess(res, result, `Bulk ${operation} completed successfully`);
  } catch (error) {
    next(error);
  }
};

// Export internal admins
export const exportInternalAdminsHandler = async (req, res, next) => {
  try {
    const { format = "csv" } = req.query;
    // exportInternalAdminsService expects (queryParams, format) per service signature
    const result = await exportInternalAdminsService(req.parsedQuery, format);

    // Create export response
    const exportResponse = createExportResponse(result.data, format, "admins");

    res.setHeader("Content-Type", exportResponse.contentType);
    res.setHeader("Content-Disposition", exportResponse.disposition);

    return res.send(exportResponse.content);
  } catch (error) {
    next(error);
  }
};

// Get internal admins statistics
export const getInternalAdminsStatsHandler = async (req, res, next) => {
  try {
    const stats = await getInternalAdminsStatsService(req.parsedQuery);

    return sendSuccess(res, stats, "Admin statistics retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// Login internal admin
export const loginInternalAdminHandler = async (req, res, next) => {
  try {
    // Enhanced debugging: log incoming request details
    console.log("🔍 DEBUG: Login attempt received:", {
      timestamp: new Date().toISOString(),
      contentType: req.headers["content-type"],
      userAgent: req.headers["user-agent"],
      origin: req.headers["origin"],
      referer: req.headers["referer"],
      bodyType: typeof req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      bodyContent: JSON.stringify(req.body),
      rawBodyLength: JSON.stringify(req.body).length,
    });

    // Validate request body
    const { email, password } = InternalAdminLoginSchema.parse(req.body);

    // Authenticate admin
    const admin = await loginInternalAdminService(email, password);

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
        type: "internal_admin",
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

// Logout internal admin
export const logoutInternalAdminHandler = async (req, res) => {
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

// Activate internal admin
export const activateInternalAdminHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get actor from authenticated user
    const actor =
      req.admin?.id || req.user?.id || req.user?.email || "anonymous";

    const activatedAdmin = await activateInternalAdminService(id, actor);

    return sendSuccess(res, activatedAdmin, "Admin activated successfully");
  } catch (error) {
    next(error);
  }
};

// Deactivate internal admin
export const deactivateInternalAdminHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get actor from authenticated user
    const actor =
      req.admin?.id || req.user?.id || req.user?.email || "anonymous";

    const deactivatedAdmin = await deactivateInternalAdminService(id, actor);

    return sendSuccess(res, deactivatedAdmin, "Admin deactivated successfully");
  } catch (error) {
    next(error);
  }
};

// PATCH internal admin by ID (partial update)
export const patchInternalAdminByIdHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate request body for partial update
    const validatedData = InternalAdminUpdateSchema.partial().parse(req.body);

    // Get actor from authenticated user
    const actor =
      req.admin?.id || req.user?.id || req.user?.email || "anonymous";

    // Update admin via service
    const updatedAdmin = await updateInternalAdminByIdService(
      id,
      validatedData,
      actor
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
