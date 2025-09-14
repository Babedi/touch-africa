#!/usr/bin/env node

/**
 * Create Sample Tenant in Firestore
 * This script creates a sample tenant using the tenant module's validation and firestore functions
 */

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// Load environment variables
config({ path: join(projectRoot, ".env") });

// Import tenant module functions
import {
  TenantSchema,
  newTenantId,
} from "../backend/modules/internal/tenant/tenant.validation.js";
import { createTenant } from "../backend/modules/internal/tenant/tenant.firestore.js";
import { db } from "../backend/services/firestore.client.js";

/**
 * Sample tenant data based on the validation schema
 */
const sampleTenants = [
  {
    name: "TouchAfrica Johannesburg Central",
    contact: {
      phoneNumber: "0114567890",
      email: "johannesburg@touchafrica.co.za",
    },
    account: {
      isActive: {
        value: true,
        changes: [],
      },
    },
  },
  {
    name: "TouchAfrica Cape Town Waterfront",
    contact: {
      phoneNumber: "0214567890",
      email: "capetown@touchafrica.co.za",
    },
    account: {
      isActive: {
        value: true,
        changes: [
          {
            by: "admin@touchafrica.co.za",
            when: new Date().toISOString(),
            action: "activated",
            reason: "Initial setup",
          },
        ],
      },
    },
  },
  {
    name: "TouchAfrica Durban Branch",
    contact: {
      phoneNumber: "0314567890",
      email: "durban@touchafrica.co.za",
    },
    account: {
      isActive: {
        value: false,
        changes: [
          {
            by: "admin@touchafrica.co.za",
            when: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            action: "deactivated",
            reason: "Temporary closure for renovation",
          },
        ],
      },
    },
  },
];

/**
 * Create a single tenant in Firestore
 */
async function createSampleTenant(tenantData, index) {
  try {
    console.log(`\n📝 Creating sample tenant ${index + 1}...`);

    // Validate the tenant data against schema
    const validatedData = TenantSchema.parse(tenantData);
    console.log(`✅ Validation passed for: ${validatedData.name}`);

    // Generate unique ID
    const tenantId = newTenantId();

    // Prepare model with metadata
    const model = {
      id: tenantId,
      ...validatedData,
      created: {
        by: "system-seeder",
        when: new Date().toISOString(),
      },
    };

    console.log(`🔧 Generated tenant ID: ${tenantId}`);

    // Create in Firestore
    const savedTenant = await createTenant(model);

    console.log(`✅ Successfully created tenant:`);
    console.log(`   - ID: ${savedTenant.id}`);
    console.log(`   - Name: ${savedTenant.name}`);
    console.log(`   - Active: ${savedTenant.account.isActive.value}`);
    console.log(`   - Path: touchAfrica/southAfrica/tenants/${savedTenant.id}`);

    return savedTenant;
  } catch (error) {
    console.error(`❌ Error creating tenant ${index + 1}:`, error.message);
    if (error.issues) {
      console.error("   Validation errors:", error.issues);
    }
    throw error;
  }
}

/**
 * Main function to create all sample tenants
 */
async function createSampleTenants() {
  try {
    console.log("🚀 Starting sample tenant creation...");
    console.log(`📊 Creating ${sampleTenants.length} sample tenants`);

    const results = [];

    for (let i = 0; i < sampleTenants.length; i++) {
      const tenant = await createSampleTenant(sampleTenants[i], i);
      results.push(tenant);

      // Small delay between creations
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`\n🎉 Successfully created ${results.length} sample tenants!`);
    console.log("\n📋 Summary:");
    results.forEach((tenant, index) => {
      console.log(
        `   ${index + 1}. ${tenant.name} (${tenant.id}) - Active: ${
          tenant.account.isActive.value
        }`
      );
    });

    console.log("\n🔍 You can verify these in Firestore Console:");
    console.log("   Collection: touchAfrica/southAfrica/tenants");
  } catch (error) {
    console.error("\n💥 Script failed:", error.message);
    process.exit(1);
  }
}

/**
 * Check Firestore connection
 */
async function checkFirestoreConnection() {
  try {
    console.log("🔍 Checking Firestore connection...");

    // Try to read from a test collection
    const testRef = db.collection("touchAfrica/southAfrica/tenants").limit(1);
    await testRef.get();

    console.log("✅ Firestore connection successful");
    return true;
  } catch (error) {
    console.error("❌ Firestore connection failed:", error.message);
    console.error(
      "   Please check your Firebase credentials and project configuration"
    );
    return false;
  }
}

/**
 * Run the script
 */
async function main() {
  console.log("🏢 TouchAfrica Tenant Seeder");
  console.log("========================================");

  // Check Firestore connection first
  const connectionOk = await checkFirestoreConnection();
  if (!connectionOk) {
    process.exit(1);
  }

  // Create sample tenants
  await createSampleTenants();

  console.log("\n✨ Tenant seeding completed successfully!");
  process.exit(0);
}

// Handle script errors
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Run the script
main().catch((error) => {
  console.error("💥 Script execution failed:", error);
  process.exit(1);
});
