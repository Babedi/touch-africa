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
import { getPersonById } from "../person/person.firestore.js";
import {
  buildFirestoreQuery,
  applySearch,
  applyFieldSelection,
  createPaginationMeta,
  convertToCSV,
  convertToJSON,
} from "../../../utilities/query.util.js";

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

// Helper function to validate password against Firestore regex (no local fallbacks)
const validatePasswordFormat = async (password) => {
  const formatDoc = await db
    .doc("touchAfrica/southAfrica/formats/passwords")
    .get();

  if (!formatDoc.exists) {
    throw new Error(
      "Password policy lookup not found at touchAfrica/southAfrica/formats/passwords"
    );
  }

  const data = formatDoc.data() || {};
  if (!data.regex) {
    throw new Error(
      "Password policy 'regex' not defined in formats/passwords lookup"
    );
  }

  const passwordRegex = new RegExp(data.regex);
  return passwordRegex.test(password);
};

// Create internal admin service
export const createInternalAdminService = async (adminData, actor) => {
  // Validate password format using Firestore policy
  const isValidPassword = await validatePasswordFormat(
    adminData.accessDetails.password
  );
  if (!isValidPassword) {
    throw new Error(
      "Password does not meet organization policy (per formats/passwords lookup)"
    );
  }

  // Check for email uniqueness - ensure no other admin has this email
  const existingAdminByEmail = await getInternalAdminByEmail(
    adminData.accessDetails.email
  );
  if (existingAdminByEmail) {
    throw new Error(
      `Email address '${adminData.accessDetails.email}' is already assigned to another admin`
    );
  }

  // Check for personId uniqueness - ensure this person is not already an admin
  const existingAdmins = await getAllInternalAdmins();
  const existingAdminByPersonId = existingAdmins.find(
    (admin) => admin.personId === adminData.personId
  );
  if (existingAdminByPersonId) {
    throw new Error(
      `Person with ID '${adminData.personId}' is already assigned as an admin`
    );
  }

  // Check if this is the first admin being created
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
    // Assign explicit highest-privilege internal role for first admin
    adminWithDefaults.roles = ["INTERNAL_ROOT_ADMIN"];
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

  // Populate person data if personId exists
  if (admin.personId) {
    try {
      const person = await getPersonById(admin.personId);
      if (person) {
        // Add person data to admin object for frontend compatibility
        admin.firstName = person.firstName;
        admin.lastName = person.surname;
        admin.fullName = `${person.firstName} ${person.surname}`.trim();
        admin.name = admin.fullName;
        admin.email = person.email || admin.accessDetails?.email;
        // Keep original person data in personalInfo
        admin.personalInfo = {
          firstName: person.firstName,
          lastName: person.surname,
          fullName: admin.fullName,
          email: person.email || admin.accessDetails?.email,
        };
      }
    } catch (error) {
      console.warn(
        `Failed to load person data for admin ${admin.id}, personId: ${admin.personId}`,
        error
      );
      // Fallback to using email from accessDetails if person lookup fails
      admin.email = admin.accessDetails?.email;
      admin.name = admin.email || "Unknown";
    }
  } else {
    // Fallback for admins without personId
    admin.email = admin.accessDetails?.email;
    admin.name = admin.email || "Unknown";
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

  // SECURITY: Prevent updates to immutable fields
  // Remove personId and email from updateData to protect these fields
  const protectedUpdateData = { ...updateData };
  delete protectedUpdateData.personId;
  if (protectedUpdateData.accessDetails) {
    delete protectedUpdateData.accessDetails.email;
    // If accessDetails becomes empty, remove it entirely
    if (Object.keys(protectedUpdateData.accessDetails).length === 0) {
      delete protectedUpdateData.accessDetails;
    }
  }

  // Check if trying to modify root admin
  if (
    existingAdmin.roles &&
    existingAdmin.roles.includes("INTERNAL_ROOT_ADMIN") &&
    actor !== id
  ) {
    throw new Error("Root admin can only be modified by itself");
  }

  // If password is being updated, hash it and validate format
  if (protectedUpdateData.accessDetails?.password) {
    const isValidPassword = await validatePasswordFormat(
      protectedUpdateData.accessDetails.password
    );
    if (!isValidPassword) {
      throw new Error("Password does not meet required format");
    }
    protectedUpdateData.accessDetails.password = hashPassword(
      protectedUpdateData.accessDetails.password
    );
  }

  // Merge update data with existing admin
  const updatedAdmin = {
    ...existingAdmin,
    ...protectedUpdateData,
    accessDetails: {
      ...existingAdmin.accessDetails,
      ...protectedUpdateData.accessDetails,
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
    existingAdmin.roles.includes("INTERNAL_ROOT_ADMIN")
  ) {
    throw new Error("Root admin cannot be deleted");
  }

  await deleteInternalAdminById(id);
  return true;
};

// List all internal admins service
export const listInternalAdminsService = async (queryParams = {}) => {
  try {
    // Fix sort field - admin documents use 'created.when' not 'createdAt'
    const correctedParams = {
      ...queryParams,
      sort: queryParams.sort || queryParams.sortBy || "created.when",
      order: queryParams.order || "desc",
    };

    // Build Firestore query (use collection path string for compatibility)
    const firestoreQuery = buildFirestoreQuery(
      "touchAfrica/southAfrica/admins",
      correctedParams
    );

    // Execute query
    const snapshot = await firestoreQuery.get();
    let admins = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Populate person data for each admin
    const adminsWithPersonData = await Promise.all(
      admins.map(async (admin) => {
        if (admin.personId) {
          try {
            const person = await getPersonById(admin.personId);
            if (person) {
              // Add person data to admin object for frontend compatibility
              admin.firstName = person.firstName;
              admin.lastName = person.surname;
              admin.fullName = `${person.firstName} ${person.surname}`.trim();
              admin.name = admin.fullName;
              admin.email = person.email || admin.accessDetails?.email;
              // Keep original person data in personalInfo for search compatibility
              admin.personalInfo = {
                firstName: person.firstName,
                lastName: person.surname,
                fullName: admin.fullName,
                email: person.email || admin.accessDetails?.email,
              };
            }
          } catch (error) {
            console.warn(
              `Failed to load person data for admin ${admin.id}, personId: ${admin.personId}`,
              error
            );
            // Fallback to using email from accessDetails if person lookup fails
            admin.email = admin.accessDetails?.email;
            admin.name = admin.email || "Unknown";
          }
        } else {
          // Fallback for admins without personId
          admin.email = admin.accessDetails?.email;
          admin.name = admin.email || "Unknown";
        }
        return admin;
      })
    );

    // Update admins array with populated data
    admins = adminsWithPersonData;

    // Apply search if specified
    if (queryParams.q) {
      const searchFields = queryParams.searchFields || [
        "personalInfo.firstName",
        "personalInfo.lastName",
        "personalInfo.fullName",
        "personalInfo.email",
        "firstName",
        "lastName",
        "fullName",
        "name",
        "email",
        "roles",
      ];
      admins = applySearch(admins, queryParams.q, searchFields);
    }

    // Apply field selection
    if (queryParams.fields || queryParams.exclude) {
      admins = applyFieldSelection(admins, queryParams);
    }

    // Remove passwords from all responses
    admins = admins.map((admin) => {
      if (!admin || !admin.accessDetails) {
        return admin;
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

    // Create pagination metadata
    const page = queryParams.page || 1;
    const limit = queryParams.limit || 20;
    const total = admins.length;
    const pagination = createPaginationMeta(page, limit, total);

    // Apply pagination to results
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const paginatedAdmins = admins.slice(startIndex, endIndex);

    return {
      data: paginatedAdmins,
      pagination,
    };
  } catch (error) {
    console.error("Error in listInternalAdminsService:", error);
    throw error;
  }
};

// Search internal admins service
export const searchInternalAdminsService = async (queryParams = {}) => {
  try {
    // Force search mode
    const searchParams = {
      ...queryParams,
      q: queryParams.q || "",
      searchFields: queryParams.searchFields || [
        "personalInfo.firstName",
        "personalInfo.lastName",
        "personalInfo.fullName",
        "personalInfo.email",
        "personalInfo.cellNumber",
        "roles",
        "status",
      ],
    };

    return await listInternalAdminsService(searchParams);
  } catch (error) {
    console.error("Error in searchInternalAdminsService:", error);
    throw error;
  }
};

// Bulk operations service
export const bulkInternalAdminsService = async (
  operation,
  data,
  filters,
  actor
) => {
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

        for (const adminData of data) {
          try {
            await createInternalAdminService(adminData, actor);
            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push({ data: adminData, error: error.message });
          }
        }
        break;

      case "update":
        if (!Array.isArray(data)) {
          throw new Error("Data must be an array for bulk update");
        }

        for (const { id, ...updateData } of data) {
          try {
            await updateInternalAdminByIdService(id, updateData, actor);
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
            await deleteInternalAdminByIdService(id, actor);
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
            await activateInternalAdminService(id, actor);
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
            await deactivateInternalAdminService(id, actor);
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
    console.error("Error in bulkInternalAdminsService:", error);
    throw error;
  }
};

// Export internal admins service
export const exportInternalAdminsService = async (
  queryParams = {},
  format = "csv"
) => {
  try {
    // Get all admins without pagination for export
    const exportParams = {
      ...queryParams,
      limit: 10000, // High limit for export
      page: 1,
    };

    const result = await listInternalAdminsService(exportParams);

    // Convert based on format
    let content;
    let contentType;
    let filename;

    switch (format.toLowerCase()) {
      case "csv":
        content = convertToCSV(result.data);
        contentType = "text/csv";
        filename = `admins_${new Date().toISOString().split("T")[0]}.csv`;
        break;

      case "json":
        content = convertToJSON(result.data);
        contentType = "application/json";
        filename = `admins_${new Date().toISOString().split("T")[0]}.json`;
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
    console.error("Error in exportInternalAdminsService:", error);
    throw error;
  }
};

// Get internal admins statistics service
export const getInternalAdminsStatsService = async (queryParams = {}) => {
  try {
    const result = await listInternalAdminsService({
      ...queryParams,
      limit: 10000,
    });
    const admins = result.data;

    // Normalize status using actual stored schema with robust fallbacks
    const normalizeStatus = (admin) => {
      const explicit = (admin.status || "").toString().toLowerCase();
      const activeFlag = admin.account?.isActive?.value;
      if (activeFlag === true) return "active";
      if (activeFlag === false) return "inactive";
      if (explicit === "active" || explicit === "enabled") return "active";
      if (explicit === "inactive" || explicit === "disabled") return "inactive";
      if (explicit === "pending" || explicit === "invited") return "pending";
      // Default newly created admins are active by system defaults
      return "active";
    };

    const getCreatedAt = (admin) => {
      return (
        admin.created?.when ||
        admin.audit?.createdAt ||
        admin.auditTrail?.createdAt ||
        admin.createdAt ||
        null
      );
    };

    const getLastLoginAt = (admin) => {
      const arr = Array.isArray(admin.accessDetails?.lastLogin)
        ? admin.accessDetails.lastLogin
        : [];
      if (arr.length > 0) return arr[arr.length - 1];
      return admin.accessDetails?.lastLoginAt || null;
    };

    const now = Date.now();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const stats = {
      total: admins.length,
      active: 0,
      inactive: 0,
      pending: 0,
      roleDistribution: {},
      recentLogins: 0,
      createdThisMonth: 0,
    };

    for (const admin of admins) {
      // Status counts
      const s = normalizeStatus(admin);
      if (s === "active") stats.active++;
      else if (s === "inactive") stats.inactive++;
      else if (s === "pending") stats.pending++;

      // Role distribution
      if (Array.isArray(admin.roles)) {
        for (const role of admin.roles) {
          stats.roleDistribution[role] =
            (stats.roleDistribution[role] || 0) + 1;
        }
      }

      // Recent logins (7 days)
      const lastLogin = getLastLoginAt(admin);
      if (lastLogin) {
        const d = new Date(lastLogin);
        if (!isNaN(d) && d > weekAgo) stats.recentLogins++;
      }

      // Created this month
      const createdAt = getCreatedAt(admin);
      if (createdAt) {
        const d = new Date(createdAt);
        if (!isNaN(d) && d >= monthStart) stats.createdThisMonth++;
      }
    }

    return stats;
  } catch (error) {
    console.error("Error in getInternalAdminsStatsService:", error);
    throw error;
  }
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
    console.log("❌ Admin not found");
    throw new Error("Invalid credentials");
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
    existingAdmin.roles.includes("INTERNAL_ROOT_ADMIN")
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
