import { z } from "zod";
import { generateToken } from "../../../utilities/auth.util.js";
import {
  serviceCreateTenantUser,
  serviceGetTenantUserById,
  serviceListTenantUsers,
  serviceUpdateTenantUser,
  serviceDeleteTenantUser,
} from "./tenant.user.service.js";
import { serviceListTenants } from "../tenant/tenant.service.js";

export const readRoles = [
  "internalRootAdmin",
  "internalSuperAdmin",
  "internalTenantManager",
  "externalRootAdmin",
  "externalSuperAdmin",
  "externalTenantManager",
  "externalTenantUserManager",
  "externalTenantUser",
  "tenantUser", // Add tenantUser role for logged-in tenant users
];

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

      // Development mode: Auto-create tenant if not found (for testing)
      if ((process.env.NODE_ENV || "").trim() === "development") {
        console.log(
          "🛠️ Development mode: Creating missing tenant for:",
          tenantName
        );
        console.log(`🛠️ NODE_ENV is: ${process.env.NODE_ENV}`);

        try {
          const newTenantData = {
            activationResponseBlockName: tenantName,
            address: {
              locality: tenantName,
              province: "Gauteng",
              country: "South Africa",
              postalCode: "2000",
            },
            activationContextMenu: {
              english: {
                menuItem1: "Life@Risk",
                menuItem2: "Property@Risk",
                menuItem3: "Both@Risk",
                menuItem4: "",
                menuItem5: "",
              },
              afrikaans: {
                menuItem1: "Lewe in Gevaar",
                menuItem2: "Eiendom in Gevaar",
                menuItem3: "Albei in Gevaar",
                menuItem4: "",
                menuItem5: "",
              },
              zulu: {
                menuItem1: "Impilo Esengozini",
                menuItem2: "Impahla Esengozini",
                menuItem3: "Zombili Esengozini",
                menuItem4: "",
                menuItem5: "",
              },
              xhosa: {
                menuItem1: "Ubomi Lusengozini",
                menuItem2: "Ipropathi Isengozini",
                menuItem3: "Zombini Zisengozini",
                menuItem4: "",
                menuItem5: "",
              },
              sotho: {
                menuItem1: "Bophelo Bo Kotsing",
                menuItem2: "Thepa E Kotsing",
                menuItem3: "Ka Bobedi Kotsing",
                menuItem4: "",
                menuItem5: "",
              },
              tswana: {
                menuItem1: "Botshelo Jwa Kotsi",
                menuItem2: "Thepa Ya Kotsi",
                menuItem3: "Tsotlhe Di Kotsing",
                menuItem4: "",
                menuItem5: "",
              },
              pedi: {
                menuItem1: "Bophelo Kotsing",
                menuItem2: "Thepa Kotsing",
                menuItem3: "Kamoka Kotsing",
                menuItem4: "",
                menuItem5: "",
              },
              venda: {
                menuItem1: "Vhutshilo Vha Khombo",
                menuItem2: "Zwiiko Zwa Khombo",
                menuItem3: "Zwothe Zwa Khombo",
                menuItem4: "",
                menuItem5: "",
              },
              tsonga: {
                menuItem1: "Vutomi Bya Xivono",
                menuItem2: "Nhundzu Ya Xivono",
                menuItem3: "Hinkwavo Ha Xivono",
                menuItem4: "",
                menuItem5: "",
              },
              swazi: {
                menuItem1: "Impilo Engcupheni",
                menuItem2: "Limpahla Engcupheni",
                menuItem3: "Kubili Kungcupheni",
                menuItem4: "",
                menuItem5: "",
              },
              ndebele: {
                menuItem1: "Impilo Engozini",
                menuItem2: "Impahla Engozini",
                menuItem3: "Zombili Ezingozini",
                menuItem4: "",
                menuItem5: "",
              },
            },
            created: { by: "auto-dev", when: new Date().toISOString() },
            active: true,
          };

          console.log(
            "🚀 Creating new tenant with data:",
            JSON.stringify(newTenantData, null, 2)
          );
          const { serviceCreateTenant } = await import(
            "../tenant/tenant.service.js"
          );
          const createdTenant = await serviceCreateTenant(newTenantData);
          console.log("✅ Auto-created tenant:", createdTenant.id);

          // Use the newly created tenant
          tenant = createdTenant;
        } catch (autoCreateError) {
          console.error("❌ Failed to auto-create tenant:", autoCreateError);
          return res.status(500).json({
            success: false,
            error: "Development mode: Failed to auto-create tenant",
          });
        }
      } else {
        return res.status(401).json({
          success: false,
          error: "Invalid credentials - tenant not found",
        });
      }
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

    // Development mode: Auto-create user if not found (for testing)
    if (
      !finalMatchingUser &&
      (process.env.NODE_ENV || "").trim() === "development"
    ) {
      console.log(
        "🛠️ Development mode: Creating missing tenant user for normalized phone:",
        normalizedPhoneNumber,
        "(original:",
        phoneNumber,
        ")"
      );
      console.log(`🛠️ NODE_ENV is: ${process.env.NODE_ENV}`);

      try {
        const newUserData = {
          title: "Mr",
          names: "Auto",
          surname: "Generated",
          subAddress: {
            streetOrFloor: "Development Street",
            unit: "1",
          },
          activationDetails: {
            phoneNumber: normalizedPhoneNumber,
            pin: pin,
            preferredMenuLanguage: "english",
            isATester: false,
            activationDate: new Date().toISOString(),
          },
          account: {
            isActive: {
              value: true,
              lastUpdated: new Date().toISOString(),
              updatedBy: "auto-generated",
            },
          },
          created: {
            by: "auto-dev",
            when: new Date().toISOString(),
          },
        };

        console.log(
          "🚀 Creating new tenant user with data:",
          JSON.stringify(newUserData, null, 2)
        );

        const createdUser = await serviceCreateTenantUser(
          tenant.id,
          newUserData,
          "auto-generated"
        );

        console.log("✅ Auto-created tenant user:", createdUser.id);
        finalMatchingUser = createdUser;
      } catch (autoCreateError) {
        console.error("❌ Failed to auto-create tenant user:", autoCreateError);
        console.error("❌ Create error details:", autoCreateError.message);
        console.error("❌ Create error stack:", autoCreateError);
      }
    }

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
      permissions: ["read", "write"],
      // Include user profile data for immediate use
      title: finalMatchingUser.title,
      names: finalMatchingUser.names,
      surname: finalMatchingUser.surname,
    };

    console.log("🔑 Authenticated tenant user data:", tenantUserData);

    // Generate JWT token with real user ID
    const token = generateToken({
      id: finalMatchingUser.id, // Use real Firestore user ID
      phoneNumber: finalMatchingUser.activationDetails.phoneNumber,
      tenantId: tenant.id,
      roles: tenantUserData.roles,
      type: "tenantUser",
    });

    console.log("🎟️ Generated token length:", token.length);

    const response = {
      success: true,
      data: {
        user: tenantUserData,
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

export const writeRoles = [
  "internalRootAdmin",
  "internalSuperAdmin",
  "internalTenantManager",
  "externalRootAdmin",
  "externalSuperAdmin",
  "externalTenantManager",
  "externalTenantUserManager",
  "externalTenantUser",
  "tenantUser", // Add tenantUser role for logged-in tenant users
];

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
    const data = await serviceListTenantUsers(tenantId);
    res.json({ success: true, data });
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
