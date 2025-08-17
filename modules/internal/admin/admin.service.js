import crypto from "crypto";
import {
  createInternalAdmin,
  getInternalAdminById,
  updateInternalAdminById,
  deleteInternalAdminById,
  activateInternalAdminById,
  deactivateInternalAdminById,
  getAllInternalAdmins,
  getInternalAdminByEmail,
} from "./admin.firestore.js";
import { newInternalAdminId } from "./admin.validation.js";
import { db } from "../../../services/firestore.client.js";

// Helper function to hash passwords using PBKDF2
const hashPassword = (password) => {
  const salt = crypto.randomBytes(32).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
};

// Helper function to verify passwords
const verifyPassword = (password, hashedPassword) => {
  if (!hashedPassword || typeof hashedPassword !== "string") {
    console.log("❌ Invalid hashedPassword:", {
      hashedPassword,
      type: typeof hashedPassword,
    });
    return false;
  }

  if (!hashedPassword.includes(":")) {
    console.log(
      "❌ hashedPassword does not contain separator:",
      hashedPassword
    );
    return false;
  }

  const [salt, hash] = hashedPassword.split(":");
  if (!salt || !hash) {
    console.log("❌ Invalid salt or hash:", { salt, hash });
    return false;
  }

  const verifyHash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return hash === verifyHash;
};

// Helper function to validate password against Firestore regex
const validatePasswordFormat = async (password) => {
  try {
    const formatDoc = await db
      .doc("services/neighbourGuardService/formats/passwords")
      .get();
    if (formatDoc.exists) {
      const { regex } = formatDoc.data();
      const passwordRegex = new RegExp(regex);
      return passwordRegex.test(password);
    }
  } catch (error) {
    console.warn(
      "Could not fetch password format from Firestore:",
      error.message
    );
  }
  // Fallback password validation
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
};

// Helper function to validate title against Firestore lookup
const validateTitle = async (title) => {
  try {
    const titleDoc = await db
      .doc("services/neighbourGuardService/lookups/titlePrefixes")
      .get();
    if (titleDoc.exists) {
      const { options } = titleDoc.data();
      return options.includes(title);
    }
  } catch (error) {
    console.warn(
      "Could not fetch title prefixes from Firestore:",
      error.message
    );
  }
  // Fallback title validation
  return ["Mr", "Mrs", "Ms", "Miss", "Dr", "Prof"].includes(title);
};

// Create internal admin service
export const createInternalAdminService = async (adminData, actor) => {
  // Validate password format
  const isValidPassword = await validatePasswordFormat(
    adminData.accessDetails.password
  );
  if (!isValidPassword) {
    throw new Error("Password does not meet required format");
  }

  // Validate title
  const isValidTitle = await validateTitle(adminData.title);
  if (!isValidTitle) {
    throw new Error("Invalid title prefix");
  }

  // Check if this is the first admin being created
  const existingAdmins = await getAllInternalAdmins();
  const isFirstAdmin = existingAdmins.length === 0;

  // Generate server-side ID
  const id = newInternalAdminId();

  // Hash password
  const hashedPassword = hashPassword(adminData.accessDetails.password);

  // Set defaults and prepare admin data
  const adminWithDefaults = {
    ...adminData,
    id,
    accessDetails: {
      ...adminData.accessDetails,
      password: hashedPassword,
      lastLogin: [],
    },
    account: {
      isActive: {
        value: true,
        changes: [],
      },
    },
    created: {
      by: actor || "system",
      when: new Date().toISOString(),
    },
  };

  // If this is the first admin, assign root admin role
  if (isFirstAdmin) {
    adminWithDefaults.roles = ["internalRootAdmin"];
  }

  // Create in Firestore
  const createdAdmin = await createInternalAdmin(adminWithDefaults);

  // Remove password from response
  const {
    accessDetails: { password, ...accessWithoutPassword },
    ...adminResponse
  } = createdAdmin;
  return {
    ...adminResponse,
    accessDetails: accessWithoutPassword,
  };
};

// Get internal admin by ID service
export const getInternalAdminByIdService = async (id) => {
  const admin = await getInternalAdminById(id);
  if (!admin) {
    return null;
  }

  // Remove password from response
  const {
    accessDetails: { password, ...accessWithoutPassword },
    ...adminResponse
  } = admin;
  return {
    ...adminResponse,
    accessDetails: accessWithoutPassword,
  };
};

// Update internal admin service
export const updateInternalAdminByIdService = async (id, updateData, actor) => {
  const existingAdmin = await getInternalAdminById(id);
  if (!existingAdmin) {
    throw new Error("Admin not found");
  }

  // Check if trying to modify root admin
  if (
    existingAdmin.roles &&
    existingAdmin.roles.includes("internalRootAdmin") &&
    actor !== id
  ) {
    throw new Error("Root admin can only be modified by itself");
  }

  // If password is being updated, hash it and validate format
  if (updateData.accessDetails?.password) {
    const isValidPassword = await validatePasswordFormat(
      updateData.accessDetails.password
    );
    if (!isValidPassword) {
      throw new Error("Password does not meet required format");
    }
    updateData.accessDetails.password = hashPassword(
      updateData.accessDetails.password
    );
  }

  // If title is being updated, validate it
  if (updateData.title) {
    const isValidTitle = await validateTitle(updateData.title);
    if (!isValidTitle) {
      throw new Error("Invalid title prefix");
    }
  }

  // Merge update data with existing admin
  const updatedAdmin = {
    ...existingAdmin,
    ...updateData,
    accessDetails: {
      ...existingAdmin.accessDetails,
      ...updateData.accessDetails,
    },
    updated: {
      by: actor || "system",
      when: new Date().toISOString(),
    },
  };

  await updateInternalAdminById(id, updatedAdmin);

  // Remove password from response
  const {
    accessDetails: { password, ...accessWithoutPassword },
    ...adminResponse
  } = updatedAdmin;
  return {
    ...adminResponse,
    accessDetails: accessWithoutPassword,
  };
};

// Delete internal admin service
export const deleteInternalAdminByIdService = async (id, actor) => {
  const existingAdmin = await getInternalAdminById(id);
  if (!existingAdmin) {
    throw new Error("Admin not found");
  }

  // Prevent deletion of root admin
  if (
    existingAdmin.roles &&
    existingAdmin.roles.includes("internalRootAdmin")
  ) {
    throw new Error("Root admin cannot be deleted");
  }

  await deleteInternalAdminById(id);
  return true;
};

// List all internal admins service
export const listInternalAdminsService = async () => {
  const admins = await getAllInternalAdmins();

  // Remove passwords from all responses
  return admins.map((admin) => {
    // Defensive programming: handle missing or malformed accessDetails
    if (!admin || !admin.accessDetails) {
      return admin; // Return as-is if structure is unexpected
    }

    const {
      accessDetails: { password, ...accessWithoutPassword },
      ...adminResponse
    } = admin;

    return {
      ...adminResponse,
      accessDetails: accessWithoutPassword,
    };
  });
};

// Login service
export const loginInternalAdminService = async (email, password) => {
  console.log("🔐 Internal Admin Login attempt:", {
    email,
    passwordLength: password?.length,
  });
  console.log("🌍 Environment check:", {
    NODE_ENV: process.env.NODE_ENV,
    trimmed: (process.env.NODE_ENV || "").trim(),
  });

  let admin = await getInternalAdminByEmail(email);
  console.log("👤 Admin lookup result:", { found: !!admin, email });

  if (!admin) {
    // Development mode: Auto-create admin if not found (for testing)
    if ((process.env.NODE_ENV || "").trim() === "development") {
      console.log(
        "🛠️ Development mode: Creating missing internal admin for email:",
        email
      );
      console.log(`🛠️ NODE_ENV is: ${process.env.NODE_ENV}`);

      try {
        const newAdminData = {
          title: "Mr",
          names: "Test",
          surname: "Admin",
          roles: ["internalSuperAdmin"],
          accessDetails: {
            email: email,
            password: password, // Will be hashed by createInternalAdminService
            lastLogin: [],
          },
          account: {
            isActive: {
              value: true,
              changes: [],
            },
          },
        };

        console.log(
          "🚀 Creating new internal admin with data:",
          JSON.stringify(newAdminData, null, 2)
        );
        const createdAdmin = await createInternalAdminService(
          newAdminData,
          "auto-dev"
        );
        console.log("✅ Auto-created internal admin:", createdAdmin.id);

        // Get the admin fresh from database with password for verification
        admin = await getInternalAdminByEmail(email);
        console.log("🔄 Retrieved fresh admin with password for verification");
      } catch (autoCreateError) {
        console.error(
          "❌ Failed to auto-create internal admin:",
          autoCreateError
        );
        throw new Error("Development mode: Failed to auto-create admin");
      }
    } else {
      console.log("❌ Not in development mode, admin not found");
      throw new Error("Invalid credentials");
    }
  }

  console.log("🔍 Admin found, checking active status:", {
    isActive: admin.account?.isActive?.value,
  });
  if (!admin.account.isActive.value) {
    console.log("❌ Account is not active");
    throw new Error("Account is not active");
  }

  console.log("🔒 Verifying password...");
  console.log("🔍 Admin password field:", {
    hasPassword: !!admin.accessDetails?.password,
    passwordType: typeof admin.accessDetails?.password,
    passwordSample: admin.accessDetails?.password?.substring(0, 10) + "...",
  });

  const isValidPassword = verifyPassword(
    password,
    admin.accessDetails.password
  );
  console.log("🔐 Password verification result:", { isValid: isValidPassword });

  if (!isValidPassword) {
    console.log("❌ Password verification failed");
    throw new Error("Invalid credentials");
  }

  // Update last login
  const loginTime = new Date().toISOString();
  admin.accessDetails.lastLogin.push(loginTime);

  await updateInternalAdminById(admin.id, admin);

  // Remove password from response
  const {
    accessDetails: { password: _, ...accessWithoutPassword },
    ...adminResponse
  } = admin;
  return {
    ...adminResponse,
    accessDetails: accessWithoutPassword,
  };
};

// Activate admin service
export const activateInternalAdminService = async (id, actor) => {
  const change = {
    by: actor || "system",
    when: new Date().toISOString(),
    action: "activated",
  };

  const activatedAdmin = await activateInternalAdminById(id, change);

  // Remove password from response
  const {
    accessDetails: { password, ...accessWithoutPassword },
    ...adminResponse
  } = activatedAdmin;
  return {
    ...adminResponse,
    accessDetails: accessWithoutPassword,
  };
};

// Deactivate admin service
export const deactivateInternalAdminService = async (id, actor) => {
  const existingAdmin = await getInternalAdminById(id);
  if (!existingAdmin) {
    throw new Error("Admin not found");
  }

  // Prevent deactivation of root admin
  if (
    existingAdmin.roles &&
    existingAdmin.roles.includes("internalRootAdmin")
  ) {
    throw new Error("Root admin cannot be deactivated");
  }

  const change = {
    by: actor || "system",
    when: new Date().toISOString(),
    action: "deactivated",
  };

  const deactivatedAdmin = await deactivateInternalAdminById(id, change);

  // Remove password from response
  const {
    accessDetails: { password, ...accessWithoutPassword },
    ...adminResponse
  } = deactivatedAdmin;
  return {
    ...adminResponse,
    accessDetails: accessWithoutPassword,
  };
};
