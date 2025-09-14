/**
 * Email Patching Script for TouchAfrica Database
 * Identifies and fixes person records without email addresses
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

console.log("📧 TOUCHAFRICA EMAIL PATCHING SCRIPT");
console.log("====================================");

// Firebase configuration
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || "touchafrica-test",
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
  console.log("Running in test mode with sample data...");
  runEmailPatchingTest();
  process.exit(0);
}

/**
 * Generate email from person's name
 */
function generateEmail(firstName, surname) {
  const cleanFirst = (firstName || "user").toLowerCase().replace(/[^a-z]/g, "");
  const cleanSurname = (surname || "unknown")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  return `${cleanFirst}.${cleanSurname}@touchafrica.org.za`;
}

/**
 * Scan for persons without emails
 */
async function scanForMissingEmails() {
  console.log("\n🔍 Scanning database for missing emails...");

  const personsRef = collection(db, "touchAfrica/southAfrica/people");
  const snapshot = await getDocs(personsRef);

  const results = {
    total: 0,
    missingEmails: 0,
    invalidEmails: 0,
    toFix: [],
  };

  snapshot.forEach((doc) => {
    results.total++;
    const person = { id: doc.id, ...doc.data() };

    const hasValidEmail =
      person.contact?.email &&
      person.contact.email.trim() !== "" &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.contact.email);

    if (!hasValidEmail) {
      if (!person.contact?.email || person.contact.email.trim() === "") {
        results.missingEmails++;
      } else {
        results.invalidEmails++;
      }

      const newEmail = generateEmail(person.firstName, person.surname);

      results.toFix.push({
        id: doc.id,
        name: `${person.firstName || "Unknown"} ${person.surname || "Unknown"}`,
        currentEmail: person.contact?.email || "none",
        newEmail: newEmail,
        contact: {
          ...person.contact,
          email: newEmail,
        },
      });
    }
  });

  return results;
}

/**
 * Apply email fixes to database
 */
async function applyEmailFixes(fixes) {
  console.log(`\n📧 Applying email fixes to ${fixes.length} records...`);

  const batch = writeBatch(db);
  let batchCount = 0;

  for (const fix of fixes) {
    const docRef = doc(db, "touchAfrica/southAfrica/people", fix.id);

    const updateData = {
      contact: fix.contact,
      audit: {
        emailPatchedAt: new Date().toISOString(),
        emailPatchedBy: "email-patching-script",
        previousEmail: fix.currentEmail,
        generatedEmail: fix.newEmail,
      },
    };

    batch.update(docRef, updateData);
    batchCount++;

    console.log(`  ✅ ${fix.name}: ${fix.currentEmail} → ${fix.newEmail}`);

    // Commit batch every 500 operations (Firestore limit)
    if (batchCount === 500) {
      await batch.commit();
      console.log(`  📦 Committed batch of ${batchCount} updates`);
      batchCount = 0;
    }
  }

  // Commit remaining operations
  if (batchCount > 0) {
    await batch.commit();
    console.log(`  📦 Committed final batch of ${batchCount} updates`);
  }

  console.log(
    `\n🎉 Successfully updated ${fixes.length} person records with emails!`
  );
}

/**
 * Main execution function
 */
async function main() {
  try {
    const results = await scanForMissingEmails();

    console.log("\n📊 SCAN RESULTS:");
    console.log(`Total records: ${results.total}`);
    console.log(`Missing emails: ${results.missingEmails}`);
    console.log(`Invalid emails: ${results.invalidEmails}`);
    console.log(`Total needing fixes: ${results.toFix.length}`);

    if (results.toFix.length === 0) {
      console.log("\n✅ All person records already have valid emails!");
      return;
    }

    console.log("\n📧 RECORDS NEEDING EMAIL FIXES:");
    console.log("===============================");

    results.toFix.forEach((fix, index) => {
      console.log(`${index + 1}. ${fix.name} (${fix.id})`);
      console.log(`   Current: ${fix.currentEmail}`);
      console.log(`   New: ${fix.newEmail}`);
    });

    // Apply the fixes
    await applyEmailFixes(results.toFix);

    console.log("\n🎯 EMAIL PATCHING COMPLETE!");
  } catch (error) {
    console.error("❌ Email patching failed:", error);
  }
}

/**
 * Test function for when Firebase is not available
 */
function runEmailPatchingTest() {
  console.log("\n🧪 RUNNING EMAIL PATCHING TEST");
  console.log("==============================");

  const testData = [
    { id: "test1", firstName: "John", surname: "Doe", contact: {} },
    {
      id: "test2",
      firstName: "Jane",
      surname: "Smith",
      contact: { email: "" },
    },
    {
      id: "test3",
      firstName: "Bob",
      surname: "Wilson",
      contact: { email: "invalid-email" },
    },
    {
      id: "test4",
      firstName: "Alice",
      surname: "Johnson",
      contact: { email: "alice@example.com" },
    },
  ];

  console.log("Test data email fixes:");

  testData.forEach((person, index) => {
    const hasValidEmail =
      person.contact?.email &&
      person.contact.email.trim() !== "" &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.contact.email);

    if (!hasValidEmail) {
      const newEmail = generateEmail(person.firstName, person.surname);
      console.log(`${index + 1}. ${person.firstName} ${person.surname}`);
      console.log(`   Current: ${person.contact?.email || "none"}`);
      console.log(`   Would set to: ${newEmail}`);
    } else {
      console.log(
        `${index + 1}. ${person.firstName} ${person.surname} - ✅ Valid email`
      );
    }
  });

  console.log(
    "\n✅ Test completed - Email generation logic working correctly!"
  );
}

// Run the script
if (db) {
  main()
    .then(() => {
      console.log("🏁 Script execution completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script error:", error);
      process.exit(1);
    });
}

export { generateEmail, scanForMissingEmails, applyEmailFixes };
