import jwt from "jsonwebtoken";
import {
  InternalAdminSchema,
  InternalAdminUpdateSchema,
  InternalAdminLoginSchema,
} from "./admin.validation.js";
import {
  createInternalAdminService,
  getInternalAdminByIdService,
  updateInternalAdminByIdService,
  deleteInternalAdminByIdService,
  listInternalAdminsService,
  loginInternalAdminService,
  activateInternalAdminService,
  deactivateInternalAdminService,
} from "./admin.service.js";

// Define authorization roles
export const readRoles = ["internalRootAdmin", "internalSuperAdmin"];
export const writeRoles = ["internalRootAdmin", "internalSuperAdmin"];

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

    res.status(201).json({
      success: true,
      data: createdAdmin,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
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
      return res.status(401).json({
        success: false,
        error: "Admin ID not found in token",
      });
    }

    const admin = await getInternalAdminByIdService(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: "Admin not found",
      });
    }

    res.json({
      success: true,
      data: admin,
    });
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
      return res.status(404).json({
        success: false,
        error: "Admin not found",
      });
    }

    res.json({
      success: true,
      data: admin,
    });
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

    res.json({
      success: true,
      data: updatedAdmin,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
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

    res.json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// List all internal admins
export const listInternalAdminsHandler = async (req, res, next) => {
  try {
    const admins = await listInternalAdminsService();

    res.json({
      success: true,
      data: admins,
    });
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

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.accessDetails.email,
        roles: admin.roles,
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

    res.json({
      success: true,
      data: {
        admin,
        token,
      },
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
    }

    if (
      error.message === "Invalid credentials" ||
      error.message === "Account is not active"
    ) {
      return res.status(401).json({
        success: false,
        error: error.message,
      });
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
  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

// Activate internal admin
export const activateInternalAdminHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get actor from authenticated user
    const actor =
      req.admin?.id || req.user?.id || req.user?.email || "anonymous";

    const activatedAdmin = await activateInternalAdminService(id, actor);

    res.json({
      success: true,
      data: activatedAdmin,
    });
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

    res.json({
      success: true,
      data: deactivatedAdmin,
    });
  } catch (error) {
    next(error);
  }
};
