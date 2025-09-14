import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

// Ensure Firestore is initialized by importing the client once
import { db } from "../services/firestore.client.js";

// Use existing services to respect validation/business rules
import { createPersonRecord } from "../modules/internal/person/person.service.js";
import {
  getInternalRoleById,
  createInternalRole,
  updateInternalRoleById,
} from "../modules/internal/role/role.firestore.js";
import { searchPersons } from "../modules/internal/person/person.firestore.js";
import {
  createInternalAdminService,
  updateInternalAdminByIdService,
} from "../modules/internal/admin/admin.service.js";
import { getInternalAdminByEmail } from "../modules/internal/admin/admin.firestore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    const ROOT_ADMIN_EMAIL = (process.env.ROOT_ADMIN_EMAIL || "").trim();
    const ROOT_ADMIN_PASSWORD = (process.env.ROOT_ADMIN_PASSWORD || "").trim();

    if (!ROOT_ADMIN_EMAIL || !ROOT_ADMIN_PASSWORD) {
      throw new Error(
        "Missing ROOT_ADMIN_EMAIL or ROOT_ADMIN_PASSWORD in environment (.env)"
      );
    }

    // Build a sample South African person object; service will add IDs and audit
    const samplePerson = {
      // Provide a valid SA ID number so DOB can be auto-extracted by the service
      idNumber: "8001015009087",
      // Omit dateOfBirth so it’s auto-extracted from idNumber by the service
      firstName: "John",
      middleNames: ["Thabo"],
      surname: "Doe",
      preferredName: "Johnny",
      gender: "Male",
      citizenshipStatus: "South African",
      contact: {
        mobile: "+27821234567",
        home: "0211234567",
        work: "0112345678",
        email: "john.doe@example.com",
      },
      addresses: {
        residential: {
          line1: "12 Example Street",
          line2: "Unit 4",
          streetNumber: "12",
          streetName: "Example Street",
          suburb: "Gardens",
          city: "Cape Town",
          municipality: "Cape Town",
          province: "Western Cape",
          postalCode: "8001",
          countryCode: "ZA",
          geo: { latitude: -33.9249, longitude: 18.4241 },
        },
        postal: {
          line1: "PO Box 123",
          city: "Cape Town",
          province: "Western Cape",
          postalCode: "8000",
          countryCode: "ZA",
        },
      },
      socioEconomic: {
        taxNumber: "123456789",
        uifNumber: "12345678",
        medicalAidNumber: "DISC-123456",
        employmentStatus: "Employed",
        employer: { name: "ACME Ltd", employeeNumber: "E12345" },
      },
      demographics: {
        race: "Black African",
        maritalStatus: "Married",
        dependentsCount: 2,
      },
      nextOfKin: {
        name: "Jane Doe",
        relationship: "Spouse",
        phoneNumber: "+27831234567",
        email: "jane.doe@example.com",
      },
      popia: {
        consent: true,
        consentTimestamp: new Date().toISOString(),
        processingBasis: "consent",
        dataSubjectCategory: "customer",
      },
    };

    // Ensure required Firestore lookups exist
    console.log("📚 Ensuring required Firestore lookups exist...");
    // Password policy lookup
    const pwdRef = db.doc("touchAfrica/southAfrica/formats/passwords");
    const pwdSnap = await pwdRef.get();
    if (!pwdSnap.exists) {
      await pwdRef.set({
        // Require at least 8 chars with upper, lower, and digit
        regex: "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d).{8,}$",
        updatedAt: new Date().toISOString(),
      });
      console.log("✅ Seeded password policy lookup");
    } else {
      console.log("🔎 Password policy lookup already present");
    }

    // Title prefixes lookup
    const titleRef = db.doc("touchAfrica/southAfrica/lookups/titlePrefixes");
    const titleSnap = await titleRef.get();
    if (!titleSnap.exists) {
      await titleRef.set({
        options: ["Mr", "Mrs", "Ms", "Miss", "Dr", "Prof"],
        updatedAt: new Date().toISOString(),
      });
      console.log("✅ Seeded title prefixes lookup");
    } else {
      console.log("🔎 Title prefixes lookup already present");
    }

    console.log("👤 Seeding sample person (idempotent)...");
    let personIdForAdmin;
    const existingPeople = await searchPersons({
      idNumber: samplePerson.idNumber,
    });
    if (existingPeople && existingPeople.length > 0) {
      personIdForAdmin = existingPeople[0].id;
      console.log("🔎 Person already exists:", personIdForAdmin);
    } else {
      const createdPerson = await createPersonRecord(
        samplePerson,
        "setup-script"
      );
      if (!createdPerson?.id) {
        throw new Error("Failed to create person: missing generated id");
      }
      personIdForAdmin = createdPerson.id;
      console.log("✅ Created person:", personIdForAdmin);
    }

    // Ensure INTERNAL_ROOT_ADMIN role exists with global access
    console.log("🛡️  Ensuring INTERNAL_ROOT_ADMIN role exists...");
    const rootRoleId = "INTERNAL_ROOT_ADMIN";
    const existingRootRole = await getInternalRoleById(rootRoleId).catch(
      () => null
    );
    if (!existingRootRole) {
      await createInternalRole(
        {
          roleCode: rootRoleId,
          roleName: "Internal Root Admin",
          description: "Root admin with full access",
          permissions: ["all.access"],
          isSystem: true,
          isActive: true,
          priority: 100,
        },
        rootRoleId
      );
      console.log("✅ Created INTERNAL_ROOT_ADMIN role with all.access");
    } else if (
      !Array.isArray(existingRootRole.permissions) ||
      !existingRootRole.permissions.includes("all.access")
    ) {
      await updateInternalRoleById(rootRoleId, {
        permissions: Array.from(
          new Set([...(existingRootRole.permissions || []), "all.access"])
        ),
      });
      console.log("🔄 Updated INTERNAL_ROOT_ADMIN role to include all.access");
    } else {
      console.log(
        "🔎 INTERNAL_ROOT_ADMIN role already present with required permissions"
      );
    }

    // Admin must reference the PERSON{13} id via personId (schema enforces PERSON+13 digits)
    const adminData = {
      // Use Human-friendly role labels
      roles: ["Internal Root Admin"],
      personId: personIdForAdmin,
      accessDetails: {
        email: ROOT_ADMIN_EMAIL,
        password: ROOT_ADMIN_PASSWORD,
        lastLogin: [],
      },
      account: {
        isActive: { value: true, changes: [] },
      },
    };

    console.log("🛡️  Seeding root internal admin...");
    // If admin exists, update; else create
    const existingAdmin = await getInternalAdminByEmail(ROOT_ADMIN_EMAIL);
    if (existingAdmin) {
      const roles = new Set([...(existingAdmin.roles || [])]);
      roles.add("Internal Root Admin");
      const updated = await updateInternalAdminByIdService(
        existingAdmin.id,
        {
          roles: Array.from(roles),
          personId: personIdForAdmin,
          account: {
            isActive: {
              value: true,
              changes: existingAdmin.account?.isActive?.changes || [],
            },
          },
        },
        "setup-script"
      );
      console.log(
        "🔄 Updated root admin:",
        updated.id,
        updated.accessDetails?.email
      );
    } else {
      adminData.personId = personIdForAdmin;
      const createdAdmin = await createInternalAdminService(
        adminData,
        "setup-script"
      );
      console.log(
        "✅ Created root admin:",
        createdAdmin.id,
        createdAdmin.accessDetails?.email
      );
    }

    console.log("🎉 Seeding complete.");
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exitCode = 1;
  }
}

// Execute when run directly
main();
