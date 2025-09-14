#!/usr/bin/env node
/**
 * Test script to validate that permission system only accepts module.action format
 */
import { PermissionSchema } from "../modules/internal/role/role.validation.js";

console.log("🧪 Testing Permission Validation - Module.Action Format Only\n");

// Test cases
const testCases = [
  // Valid module.action formats
  {
    permission: "role.read",
    shouldPass: true,
    description: "Simple module.action",
  },
  {
    permission: "admin.manage",
    shouldPass: true,
    description: "Admin management",
  },
  {
    permission: "cultivarTemplate.create",
    shouldPass: true,
    description: "CamelCase module",
  },
  {
    permission: "user.profile.update",
    shouldPass: true,
    description: "Nested module.action",
  },
  {
    permission: "system.emergency.override",
    shouldPass: true,
    description: "Deep nested module.action",
  },
  {
    permission: "report.export",
    shouldPass: true,
    description: "Report export action",
  },

  // Invalid old formats (should fail)
  { permission: "read", shouldPass: false, description: "Old format: read" },
  { permission: "write", shouldPass: false, description: "Old format: write" },
  {
    permission: "update",
    shouldPass: false,
    description: "Old format: update",
  },
  {
    permission: "delete",
    shouldPass: false,
    description: "Old format: delete",
  },
  { permission: "admin", shouldPass: false, description: "Old format: admin" },
  {
    permission: "super_admin",
    shouldPass: false,
    description: "Old format: super_admin",
  },
  {
    permission: "manage_users",
    shouldPass: false,
    description: "Old format: manage_users",
  },
  {
    permission: "manage_roles",
    shouldPass: false,
    description: "Old format: manage_roles",
  },
  {
    permission: "manage_tenants",
    shouldPass: false,
    description: "Old format: manage_tenants",
  },
  {
    permission: "manage_system",
    shouldPass: false,
    description: "Old format: manage_system",
  },
  {
    permission: "view_reports",
    shouldPass: false,
    description: "Old format: view_reports",
  },
  {
    permission: "export_data",
    shouldPass: false,
    description: "Old format: export_data",
  },
  {
    permission: "emergency_override",
    shouldPass: false,
    description: "Old format: emergency_override",
  },

  // Invalid formats
  { permission: "", shouldPass: false, description: "Empty string" },
  { permission: ".", shouldPass: false, description: "Just dot" },
  { permission: "module.", shouldPass: false, description: "Missing action" },
  { permission: ".action", shouldPass: false, description: "Missing module" },
  {
    permission: "module.action.",
    shouldPass: false,
    description: "Trailing dot",
  },
  { permission: "123.action", shouldPass: false, description: "Number start" },
  {
    permission: "module.123",
    shouldPass: false,
    description: "Number action start",
  },
];

let passed = 0;
let failed = 0;

console.log("Running validation tests...\n");

for (const testCase of testCases) {
  try {
    PermissionSchema.parse(testCase.permission);
    // If we get here, validation passed
    if (testCase.shouldPass) {
      console.log(
        `✅ PASS: ${testCase.description} - "${testCase.permission}"`
      );
      passed++;
    } else {
      console.log(
        `❌ FAIL: ${testCase.description} - "${testCase.permission}" (should have been rejected)`
      );
      failed++;
    }
  } catch (error) {
    // Validation failed
    if (!testCase.shouldPass) {
      console.log(
        `✅ PASS: ${testCase.description} - "${testCase.permission}" (correctly rejected)`
      );
      passed++;
    } else {
      console.log(
        `❌ FAIL: ${testCase.description} - "${testCase.permission}" (should have passed)`
      );
      console.log(`   Error: ${error.message}`);
      failed++;
    }
  }
}

console.log(`\n📊 Test Results:`);
console.log(`   Passed: ${passed}`);
console.log(`   Failed: ${failed}`);
console.log(`   Total:  ${testCases.length}`);

if (failed === 0) {
  console.log(
    `\n🎉 All tests passed! Permission validation strictly enforces module.action format.`
  );
  process.exit(0);
} else {
  console.log(
    `\n💥 ${failed} test(s) failed. Permission validation needs attention.`
  );
  process.exit(1);
}
