#!/usr/bin/env node

/**
 * Simple Tenant Creator - Run from backend directory
 * Creates a single sample tenant in Firestore
 */

import {
  TenantSchema,
  newTenantId,
} from "./modules/internal/tenant/tenant.validation.js";
import { createTenant } from "./modules/internal/tenant/tenant.firestore.js";
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

async function createSampleTenant() {
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
        by: "admin-seeder",
        when: new Date().toISOString(),
      },
    };

    // Create in Firestore
    const savedTenant = await createTenant(model);

    console.log("✅ Successfully created tenant:");
    console.log(`   - ID: ${savedTenant.id}`);
    console.log(`   - Name: ${savedTenant.name}`);
    console.log(`   - Active: ${savedTenant.account.isActive.value}`);
    console.log(
      `   - Firestore Path: touchAfrica/southAfrica/tenants/${savedTenant.id}`
    );

    return savedTenant;
  } catch (error) {
    console.error("❌ Error creating tenant:", error.message);
    if (error.issues) {
      console.error("Validation errors:", error.issues);
    }
    throw error;
  }
}

// Run the creation
createSampleTenant()
  .then(() => {
    console.log("\n🎉 Sample tenant created successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Failed to create sample tenant:", error);
    process.exit(1);
  });
