#!/usr/bin/env node

/**
 * Manual Tenant Creator with Timeout
 * Creates a sample tenant with connection timeout handling
 */

import {
  TenantSchema,
  newTenantId,
} from "./modules/internal/tenant/tenant.validation.js";
import { db } from "./services/firestore.client.js";

// Sample tenant data
const sampleTenant = {
  name: "TouchAfrica Johannesburg Central",
  account: {
    isActive: {
      value: true,
      changes: [],
    },
  },
};

async function createTenantManually() {
  try {
    console.log("🏢 Creating sample tenant in Firestore...");

    // Validate data
    const validatedData = TenantSchema.parse(sampleTenant);
    console.log(`✅ Validation passed for: ${validatedData.name}`);

    // Generate ID
    const tenantId = newTenantId();
    console.log(`🔧 Generated ID: ${tenantId}`);

    // Prepare model
    const model = {
      id: tenantId,
      ...validatedData,
      created: {
        by: "admin-script",
        when: new Date().toISOString(),
      },
    };

    console.log("📤 Writing to Firestore...");
    console.log(`   Path: touchAfrica/southAfrica/tenants/${tenantId}`);

    // Create in Firestore with timeout
    const docRef = db
      .collection("touchAfrica/southAfrica/tenants")
      .doc(tenantId);

    // Use Promise.race for timeout
    const writePromise = docRef.set(model, { merge: true });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Firestore write timeout after 10 seconds")),
        10000
      )
    );

    await Promise.race([writePromise, timeoutPromise]);

    console.log("✅ Successfully created tenant:");
    console.log(`   - ID: ${model.id}`);
    console.log(`   - Name: ${model.name}`);
    console.log(`   - Active: ${model.account.isActive.value}`);
    console.log(`   - Created: ${model.created.when}`);

    // Verify the write by reading it back
    console.log("🔍 Verifying write by reading back...");
    const verifyPromise = docRef.get();
    const verifyTimeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Firestore read timeout after 5 seconds")),
        5000
      )
    );

    const doc = await Promise.race([verifyPromise, verifyTimeoutPromise]);

    if (doc.exists) {
      const data = doc.data();
      console.log("✅ Verification successful - document exists in Firestore");
      console.log(`   Retrieved name: ${data.name}`);
    } else {
      console.log("⚠️  Warning: Document was not found during verification");
    }

    return model;
  } catch (error) {
    console.error("❌ Error creating tenant:", error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.issues) {
      console.error("   Validation errors:", error.issues);
    }
    throw error;
  }
}

// Run with proper error handling and timeout
console.log("🚀 Starting tenant creation with timeout protection...");

const mainTimeout = setTimeout(() => {
  console.error("💥 Script timeout after 30 seconds");
  process.exit(1);
}, 30000);

createTenantManually()
  .then(() => {
    clearTimeout(mainTimeout);
    console.log("\n🎉 Sample tenant created successfully!");
    console.log("🔍 You can verify this in the Firebase Console under:");
    console.log("   Project: ussd-120247728-project");
    console.log("   Collection: touchAfrica/southAfrica/tenants");
    process.exit(0);
  })
  .catch((error) => {
    clearTimeout(mainTimeout);
    console.error("\n💥 Failed to create sample tenant:", error.message);
    console.error("This might be due to:");
    console.error("  - Network connectivity issues");
    console.error("  - Firebase project permissions");
    console.error("  - Invalid service account credentials");
    process.exit(1);
  });
