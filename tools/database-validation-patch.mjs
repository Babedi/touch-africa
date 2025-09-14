/**
 * Database Data Validation and Patching Script
 * Identifies and fixes invalid data in the persons collection
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { extractDateFromSAId } from "../backend/modules/internal/person/person.validation.js";

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || "touchafrica-test", // Replace with your project ID
};

let app, db;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log(
    `🔥 Firebase initialized with project: ${firebaseConfig.projectId}`
  );
} catch (error) {
  console.warn("⚠️ Firebase initialization failed:", error.message);
  console.log("Running in validation-only mode (no database connection)");
}

/**
 * Validate a single person record
 * @param {Object} person - Person data
 * @returns {Object} Validation result with errors and fixes
 */
function validatePersonData(person) {
  const errors = [];
  const fixes = {};

  // Validate first name
  if (
    !person.firstName ||
    typeof person.firstName !== "string" ||
    person.firstName.trim().length === 0
  ) {
    errors.push("Missing or invalid first name");
    if (!person.firstName) fixes.firstName = "Unknown";
  } else if (person.firstName.length > 50) {
    errors.push("First name too long");
    fixes.firstName = person.firstName.substring(0, 50);
  } else if (!/^[A-Za-z\s\-'\.]+$/.test(person.firstName)) {
    errors.push("First name contains invalid characters");
    fixes.firstName = person.firstName.replace(/[^A-Za-z\s\-'\.]/g, "");
  }

  // Validate surname
  if (
    !person.surname ||
    typeof person.surname !== "string" ||
    person.surname.trim().length === 0
  ) {
    errors.push("Missing or invalid surname");
    if (!person.surname) fixes.surname = "Unknown";
  } else if (person.surname.length > 50) {
    errors.push("Surname too long");
    fixes.surname = person.surname.substring(0, 50);
  } else if (!/^[A-Za-z\s\-'\.]+$/.test(person.surname)) {
    errors.push("Surname contains invalid characters");
    fixes.surname = person.surname.replace(/[^A-Za-z\s\-'\.]/g, "");
  }

  // Validate SA ID number - simplified validation (format only)
  if (person.idNumber) {
    if (
      typeof person.idNumber !== "string" ||
      !/^\d{13}$/.test(person.idNumber)
    ) {
      errors.push("Invalid SA ID format - must be 13 digits");
    }
    // Note: Checkdigit validation removed per simplified validation requirements

    // Check date consistency
    if (person.dateOfBirth) {
      const extractedDate = extractDateFromSAId(person.idNumber);
      if (extractedDate && extractedDate !== person.dateOfBirth) {
        errors.push("Date of birth does not match SA ID");
        fixes.dateOfBirth = extractedDate;
      }
    }
  }

  // Validate date of birth
  if (person.dateOfBirth) {
    if (
      typeof person.dateOfBirth !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(person.dateOfBirth)
    ) {
      errors.push("Invalid date of birth format");
    } else {
      const dob = new Date(person.dateOfBirth);
      const today = new Date();
      const minDate = new Date(1900, 0, 1);

      if (isNaN(dob.getTime())) {
        errors.push("Invalid date of birth");
      } else if (dob > today) {
        errors.push("Date of birth in future");
      } else if (dob < minDate) {
        errors.push("Date of birth too old");
      }
    }
  }

  // Validate gender
  if (person.gender) {
    const validGenders = ["Male", "Female", "Other", "Prefer not to say"];
    if (!validGenders.includes(person.gender)) {
      errors.push("Invalid gender");
      fixes.gender = "Other";
    }
  }

  // Validate contact information
  if (person.contact) {
    const phoneRegex = /^(\+27|0)\d{9}$/;

    if (person.contact.mobile && !phoneRegex.test(person.contact.mobile)) {
      errors.push("Invalid mobile number format");
      // Try to fix common mobile number issues
      let mobile = person.contact.mobile.replace(/\s/g, "");
      if (mobile.startsWith("27") && mobile.length === 11) {
        fixes.contact = { ...fixes.contact, mobile: "+" + mobile };
      } else if (mobile.startsWith("0") && mobile.length === 10) {
        fixes.contact = { ...fixes.contact, mobile: mobile };
      } else {
        fixes.contact = { ...fixes.contact, mobile: null }; // Remove invalid mobile
      }
    }

    if (person.contact.home && !phoneRegex.test(person.contact.home)) {
      errors.push("Invalid home number format");
      fixes.contact = { ...fixes.contact, home: null };
    }

    if (person.contact.work && !phoneRegex.test(person.contact.work)) {
      errors.push("Invalid work number format");
      fixes.contact = { ...fixes.contact, work: null };
    }

    // Check for missing email and generate one
    if (!person.contact.email || person.contact.email.trim() === "") {
      errors.push("Missing email address");
      // Generate email from name
      const firstName = (person.firstName || "user")
        .toLowerCase()
        .replace(/[^a-z]/g, "");
      const surname = (person.surname || "unknown")
        .toLowerCase()
        .replace(/[^a-z]/g, "");
      const generatedEmail = `${firstName}.${surname}@touchafrica.org.za`;
      fixes.contact = { ...fixes.contact, email: generatedEmail };
    } else if (
      person.contact.email &&
      typeof person.contact.email === "string"
    ) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(person.contact.email)) {
        errors.push("Invalid email format");
        // Generate email from name for invalid emails too
        const firstName = (person.firstName || "user")
          .toLowerCase()
          .replace(/[^a-z]/g, "");
        const surname = (person.surname || "unknown")
          .toLowerCase()
          .replace(/[^a-z]/g, "");
        const generatedEmail = `${firstName}.${surname}@touchafrica.org.za`;
        fixes.contact = { ...fixes.contact, email: generatedEmail };
      }
    }
  } else {
    // No contact object at all - create one with email
    errors.push("Missing contact information");
    const firstName = (person.firstName || "user")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
    const surname = (person.surname || "unknown")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
    const generatedEmail = `${firstName}.${surname}@touchafrica.org.za`;
    fixes.contact = { email: generatedEmail };
  }

  // Validate addresses
  if (person.addresses?.residential) {
    const addr = person.addresses.residential;

    if (addr.postalCode && !/^\d{4}$/.test(addr.postalCode)) {
      errors.push("Invalid postal code");
      // Try to fix postal code
      const digits = addr.postalCode.replace(/\D/g, "");
      if (digits.length === 4) {
        fixes.addresses = { residential: { ...addr, postalCode: digits } };
      } else {
        fixes.addresses = { residential: { ...addr, postalCode: null } };
      }
    }

    const validProvinces = [
      "Eastern Cape",
      "Free State",
      "Gauteng",
      "KwaZulu-Natal",
      "Limpopo",
      "Mpumalanga",
      "Northern Cape",
      "North West",
      "Western Cape",
    ];
    if (addr.province && !validProvinces.includes(addr.province)) {
      errors.push("Invalid province");
      // Try to match common variations
      const provinceMap = {
        gauteng: "Gauteng",
        "western cape": "Western Cape",
        kzn: "KwaZulu-Natal",
        "kwazulu natal": "KwaZulu-Natal",
        "eastern cape": "Eastern Cape",
        "northern cape": "Northern Cape",
        "north west": "North West",
        northwest: "North West",
        "free state": "Free State",
      };
      const matchedProvince = provinceMap[addr.province.toLowerCase()];
      if (matchedProvince) {
        fixes.addresses = {
          ...fixes.addresses,
          residential: { ...addr, province: matchedProvince },
        };
      }
    }
  }

  return {
    errors,
    fixes,
    hasErrors: errors.length > 0,
    hasFixes: Object.keys(fixes).length > 0,
  };
}

/**
 * Scan all person records and identify validation issues
 */
async function scanDatabase() {
  if (!db) {
    console.log(
      "🧪 Running validation test with sample data (no database connection)"
    );
    return runValidationTests();
  }

  console.log("🔍 Scanning database for validation issues...");

  const personsRef = collection(db, "touchAfrica/southAfrica/people");
  const snapshot = await getDocs(personsRef);

  const results = {
    total: 0,
    withErrors: 0,
    withFixes: 0,
    errors: [],
    fixes: [],
  };

  snapshot.forEach((doc) => {
    results.total++;
    const person = { id: doc.id, ...doc.data() };
    const validation = validatePersonData(person);

    if (validation.hasErrors) {
      results.withErrors++;
      results.errors.push({
        id: doc.id,
        name: `${person.firstName || "Unknown"} ${person.surname || "Unknown"}`,
        errors: validation.errors,
        fixes: validation.fixes,
      });

      if (validation.hasFixes) {
        results.withFixes++;
        results.fixes.push({
          id: doc.id,
          fixes: validation.fixes,
        });
      }
    }
  });

  return results;
}

/**
 * Apply fixes to the database
 */
async function applyFixes(fixes, dryRun = true) {
  console.log(
    `${dryRun ? "🧪 DRY RUN" : "🔧 APPLYING FIXES"} - Processing ${
      fixes.length
    } records...`
  );

  if (dryRun) {
    fixes.forEach((fix) => {
      console.log(`Would fix ${fix.id}:`, JSON.stringify(fix.fixes, null, 2));
    });
    return;
  }

  const batch = writeBatch(db);
  let batchCount = 0;

  for (const fix of fixes) {
    const docRef = doc(db, "touchAfrica/southAfrica/people", fix.id);

    // Add audit information
    const updateData = {
      ...fix.fixes,
      audit: {
        updatedAt: new Date().toISOString(),
        updatedBy: "data-validation-script",
        reason: "Automated data validation and correction",
      },
    };

    batch.update(docRef, updateData);
    batchCount++;

    // Firestore batch limit is 500 operations
    if (batchCount === 500) {
      await batch.commit();
      console.log(`✅ Applied fixes to ${batchCount} records`);
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    console.log(`✅ Applied fixes to ${batchCount} remaining records`);
  }
}

/**
 * Run validation tests with sample data when database is not available
 */
function runValidationTests() {
  console.log("📊 Testing validation with sample data...");

  const testData = [
    {
      id: "test1",
      firstName: "John",
      surname: "Doe",
      idNumber: "8001015009087", // Valid SA ID
      dateOfBirth: "1980-01-01",
      gender: "Male",
      contact: {
        email: "john.doe@example.com",
        mobile: "+27123456789",
      },
      addresses: {
        residential: {
          line1: "123 Main St",
          city: "Cape Town",
          province: "Western Cape",
          postalCode: "8001",
        },
      },
    },
    {
      id: "test2",
      firstName: "Jane123", // Invalid characters
      surname: "", // Empty surname
      idNumber: "1234567890123", // Invalid check digit
      dateOfBirth: "2050-01-01", // Future date
      gender: "Unknown", // Invalid gender
      contact: {
        email: "invalid-email", // Invalid format
        mobile: "123456", // Invalid format
        home: "27123456789", // Missing +
      },
      addresses: {
        residential: {
          postalCode: "ABC123", // Invalid format
          province: "gauteng", // Wrong case
        },
      },
    },
    {
      id: "test3",
      firstName: "Alice",
      surname: "Smith",
      idNumber: "8506152800086", // Valid female SA ID
      dateOfBirth: "1985-06-15",
      contact: {
        mobile: "0987654321", // Valid SA format
        email: "alice@example.com",
      },
      addresses: {
        residential: {
          postalCode: "2001X", // Fixable - contains digits
        },
      },
    },
  ];

  const results = {
    total: 0,
    withErrors: 0,
    withFixes: 0,
    errors: [],
    fixes: [],
  };

  testData.forEach((person) => {
    results.total++;
    console.log(
      `\n🔍 Validating: ${person.firstName || "Unknown"} ${
        person.surname || "Unknown"
      }`
    );

    const validation = validatePersonData(person);

    if (validation.hasErrors) {
      results.withErrors++;
      results.errors.push({
        id: person.id,
        name: `${person.firstName || "Unknown"} ${person.surname || "Unknown"}`,
        errors: validation.errors,
        fixes: validation.fixes,
      });

      console.log(`  ❌ ${validation.errors.length} error(s) found:`);
      validation.errors.forEach((error) => console.log(`    - ${error}`));

      if (validation.hasFixes) {
        results.withFixes++;
        results.fixes.push({
          id: person.id,
          fixes: validation.fixes,
        });

        console.log(`  🔧 Suggested fixes:`);
        Object.entries(validation.fixes).forEach(([field, value]) => {
          console.log(`    - ${field}: ${JSON.stringify(value)}`);
        });
      }
    } else {
      console.log("  ✅ No issues found");
    }
  });

  return results;
}

/**
 * Generate sample valid data for testing
 */
async function generateSampleData() {
  console.log("📝 Generating sample valid person data...");

  const samplePersons = [
    {
      firstName: "John",
      surname: "Doe",
      idNumber: "8001015800089", // Valid SA ID
      dateOfBirth: "1980-01-01",
      gender: "Male",
      contact: {
        email: "john.doe@example.com",
        mobile: "+27123456789",
      },
      addresses: {
        residential: {
          line1: "123 Main Street",
          city: "Cape Town",
          province: "Western Cape",
          postalCode: "8001",
          countryCode: "ZA",
        },
      },
    },
    {
      firstName: "Jane",
      surname: "Smith",
      idNumber: "8506152800086", // Valid SA ID for female
      dateOfBirth: "1985-06-15",
      gender: "Female",
      contact: {
        email: "jane.smith@example.com",
        mobile: "0987654321",
      },
      addresses: {
        residential: {
          line1: "456 Oak Avenue",
          city: "Johannesburg",
          province: "Gauteng",
          postalCode: "2001",
          countryCode: "ZA",
        },
      },
    },
  ];

  const batch = writeBatch(db);

  samplePersons.forEach((person, index) => {
    const docRef = doc(collection(db, "persons"));
    batch.set(docRef, {
      ...person,
      audit: {
        createdAt: new Date().toISOString(),
        createdBy: "data-validation-script",
        recordVersion: 1,
      },
    });
  });

  await batch.commit();
  console.log(`✅ Created ${samplePersons.length} sample persons`);
}

/**
 * Scan specifically for persons missing email addresses
 */
async function scanForMissingEmails() {
  if (!db) {
    console.log(
      "🧪 Running missing email test with sample data (no database connection)"
    );
    return runMissingEmailTests();
  }

  console.log("📧 Scanning for persons without email addresses...");

  const personsRef = collection(db, "touchAfrica/southAfrica/people");
  const snapshot = await getDocs(personsRef);

  const results = {
    total: 0,
    missingEmails: 0,
    invalidEmails: 0,
    fixes: [],
  };

  snapshot.forEach((doc) => {
    results.total++;
    const person = { id: doc.id, ...doc.data() };

    const needsEmailFix =
      !person.contact?.email ||
      person.contact.email.trim() === "" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.contact.email);

    if (needsEmailFix) {
      if (!person.contact?.email || person.contact.email.trim() === "") {
        results.missingEmails++;
      } else {
        results.invalidEmails++;
      }

      // Generate email fix
      const firstName = (person.firstName || "user")
        .toLowerCase()
        .replace(/[^a-z]/g, "");
      const surname = (person.surname || "unknown")
        .toLowerCase()
        .replace(/[^a-z]/g, "");
      const generatedEmail = `${firstName}.${surname}@touchafrica.org.za`;

      results.fixes.push({
        id: doc.id,
        name: `${person.firstName || "Unknown"} ${person.surname || "Unknown"}`,
        currentEmail: person.contact?.email || "none",
        newEmail: generatedEmail,
        fixes: {
          contact: {
            ...person.contact,
            email: generatedEmail,
          },
        },
      });
    }
  });

  return results;
}

/**
 * Test missing email detection with sample data
 */
function runMissingEmailTests() {
  console.log("📧 Testing missing email detection with sample data...");

  const testData = [
    {
      id: "test1",
      firstName: "John",
      surname: "Doe",
      contact: {}, // Missing email
    },
    {
      id: "test2",
      firstName: "Jane",
      surname: "Smith",
      contact: {
        email: "", // Empty email
      },
    },
    {
      id: "test3",
      firstName: "Bob",
      surname: "Wilson",
      contact: {
        email: "invalid-email", // Invalid format
      },
    },
    {
      id: "test4",
      firstName: "Alice",
      surname: "Johnson",
      contact: {
        email: "alice.johnson@example.com", // Valid email
      },
    },
  ];

  const results = {
    total: 0,
    missingEmails: 0,
    invalidEmails: 0,
    fixes: [],
  };

  testData.forEach((person) => {
    results.total++;

    const needsEmailFix =
      !person.contact?.email ||
      person.contact.email.trim() === "" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.contact.email);

    if (needsEmailFix) {
      if (!person.contact?.email || person.contact.email.trim() === "") {
        results.missingEmails++;
      } else {
        results.invalidEmails++;
      }

      const firstName = (person.firstName || "user")
        .toLowerCase()
        .replace(/[^a-z]/g, "");
      const surname = (person.surname || "unknown")
        .toLowerCase()
        .replace(/[^a-z]/g, "");
      const generatedEmail = `${firstName}.${surname}@touchafrica.org.za`;

      results.fixes.push({
        id: person.id,
        name: `${person.firstName || "Unknown"} ${person.surname || "Unknown"}`,
        currentEmail: person.contact?.email || "none",
        newEmail: generatedEmail,
        fixes: {
          contact: {
            ...person.contact,
            email: generatedEmail,
          },
        },
      });
    }
  });

  return results;
}

/**
 * Apply email fixes specifically
 */
async function applyEmailFixes(fixes, dryRun = true) {
  console.log(
    `${dryRun ? "🧪 DRY RUN" : "📧 APPLYING EMAIL FIXES"} - Processing ${
      fixes.length
    } records...`
  );

  if (dryRun) {
    fixes.forEach((fix) => {
      console.log(`\n📋 ${fix.name} (${fix.id}):`);
      console.log(`  Current: ${fix.currentEmail}`);
      console.log(`  New: ${fix.newEmail}`);
    });
    return;
  }

  if (!db) {
    console.log("❌ No database connection - cannot apply fixes");
    return;
  }

  const batch = writeBatch(db);
  let batchCount = 0;

  for (const fix of fixes) {
    const docRef = doc(db, "touchAfrica/southAfrica/people", fix.id);

    // Add audit information
    const updateData = {
      contact: fix.fixes.contact,
      audit: {
        updatedAt: new Date().toISOString(),
        updatedBy: "email-patching-script",
        reason: "Generated missing email address",
        previousEmail: fix.currentEmail,
      },
    };

    batch.update(docRef, updateData);
    batchCount++;

    // Firestore batch limit is 500 operations
    if (batchCount === 500) {
      await batch.commit();
      console.log(`✅ Applied email fixes to ${batchCount} records`);
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    console.log(`✅ Applied email fixes to ${batchCount} remaining records`);
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log("🚀 Starting database validation and email patching...");

    // Check for missing emails specifically
    console.log("\n📧 SCANNING FOR MISSING EMAILS");
    console.log("===============================");

    const emailResults = await scanForMissingEmails();

    console.log(`Total records: ${emailResults.total}`);
    console.log(`Missing emails: ${emailResults.missingEmails}`);
    console.log(`Invalid emails: ${emailResults.invalidEmails}`);
    console.log(`Total needing email fixes: ${emailResults.fixes.length}`);

    if (emailResults.fixes.length > 0) {
      console.log("\n� EMAIL FIXES NEEDED:");
      emailResults.fixes.forEach((fix) => {
        console.log(`\n📋 ${fix.name} (${fix.id}):`);
        console.log(`  Current: ${fix.currentEmail}`);
        console.log(`  Will set to: ${fix.newEmail}`);
      });

      console.log("\n🔧 APPLYING EMAIL FIXES...");
      console.log("Running dry run first...");
      await applyEmailFixes(emailResults.fixes, true);

      // Apply actual email fixes
      console.log("\n📧 Applying actual email fixes...");
      await applyEmailFixes(emailResults.fixes, false);
    } else {
      console.log("✅ All records have valid emails!");
    }

    // Run general validation scan
    console.log("\n🔍 RUNNING GENERAL VALIDATION SCAN");
    console.log("==================================");

    const scanResults = await scanDatabase();

    console.log(`Total records: ${scanResults.total}`);
    console.log(`Records with errors: ${scanResults.withErrors}`);
    console.log(`Records with fixable issues: ${scanResults.withFixes}`);

    if (scanResults.withErrors > 0) {
      console.log("\n❌ OTHER VALIDATION ERRORS FOUND:");
      scanResults.errors.forEach((error) => {
        console.log(`\n📋 ${error.name} (${error.id}):`);
        error.errors.forEach((err) => console.log(`  - ${err}`));
        if (Object.keys(error.fixes).length > 0) {
          console.log(
            "  🔧 Suggested fixes:",
            JSON.stringify(error.fixes, null, 4)
          );
        }
      });

      if (scanResults.withFixes > 0) {
        console.log("\n🔧 GENERAL FIXES AVAILABLE...");
        console.log("Running dry run...");
        await applyFixes(scanResults.fixes, true);

        // Uncomment to actually apply general fixes
        // console.log('\nApplying actual fixes...');
        // await applyFixes(scanResults.fixes, false);
      }
    } else {
      console.log("✅ No other validation errors found!");
    }

    // Uncomment to generate sample data
    // await generateSampleData();
  } catch (error) {
    console.error("❌ Script failed:", error);
  }
}

// Run the script
main()
  .then(() => {
    console.log("🎯 Database validation complete");
  })
  .catch((error) => {
    console.error("💥 Script error:", error);
  });

export {
  validatePersonData,
  scanDatabase,
  applyFixes,
  generateSampleData,
  scanForMissingEmails,
  applyEmailFixes,
};
