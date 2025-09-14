#!/usr/bin/env node

/**
 * Create Tenant via REST API (alternative approach)
 * Uses Firebase REST API instead of Admin SDK
 */

import https from "https";
import {
  TenantSchema,
  newTenantId,
} from "./modules/internal/tenant/tenant.validation.js";

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

async function createTenantViaREST() {
  try {
    console.log("🏢 Creating sample tenant via Firebase REST API...");

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
        by: "rest-api-script",
        when: new Date().toISOString(),
      },
    };

    console.log("📤 Writing via REST API...");
    console.log(`   Project: ussd-120247728-project`);
    console.log(`   Path: touchAfrica/southAfrica/tenants/${tenantId}`);

    // Create the REST API URL
    const projectId = "ussd-120247728-project";
    const path = `/v1/projects/${projectId}/databases/(default)/documents/touchAfrica/southAfrica/tenants/${tenantId}`;

    const postData = JSON.stringify({
      fields: convertToFirestoreFields(model),
    });

    const options = {
      hostname: "firestore.googleapis.com",
      port: 443,
      path: path,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    console.log("🌐 Making REST API request...");

    const response = await makeRequest(options, postData);

    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log("✅ Successfully created tenant via REST API:");
      console.log(`   - ID: ${model.id}`);
      console.log(`   - Name: ${model.name}`);
      console.log(`   - Active: ${model.account.isActive.value}`);
      console.log(`   - Response Status: ${response.statusCode}`);

      return model;
    } else {
      throw new Error(
        `REST API request failed with status ${response.statusCode}: ${response.body}`
      );
    }
  } catch (error) {
    console.error("❌ Error creating tenant via REST API:", error.message);
    throw error;
  }
}

// Convert JS object to Firestore REST API format
function convertToFirestoreFields(obj) {
  const fields = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      fields[key] = { stringValue: value };
    } else if (typeof value === "boolean") {
      fields[key] = { booleanValue: value };
    } else if (typeof value === "number") {
      fields[key] = { integerValue: value.toString() };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map((item) =>
            typeof item === "object"
              ? { mapValue: { fields: convertToFirestoreFields(item) } }
              : { stringValue: item.toString() }
          ),
        },
      };
    } else if (typeof value === "object" && value !== null) {
      fields[key] = {
        mapValue: {
          fields: convertToFirestoreFields(value),
        },
      };
    }
  }

  return fields;
}

// Make HTTP request
function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
        });
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

// Run the script
console.log("🚀 Starting tenant creation via REST API...");

createTenantViaREST()
  .then(() => {
    console.log("\n🎉 Sample tenant created successfully via REST API!");
    console.log("🔍 You can verify this in the Firebase Console");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Failed to create sample tenant:", error.message);
    console.error(
      "Note: REST API approach doesn't require authentication for this test"
    );
    process.exit(1);
  });
