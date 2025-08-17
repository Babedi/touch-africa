/**
 * Complete Test File Migration Script
 * Systematically moves all test and debug files to tests/ directory
 */

import fs from "fs";
import path from "path";

const ROOT_DIR = "c:\\Users\\Development\\Desktop\\TouchAfrica";
const TESTS_DIR = path.join(ROOT_DIR, "tests");

console.log("🎯 COMPLETE TEST FILE MIGRATION");
console.log("===============================");
console.log(`Source: ${ROOT_DIR}`);
console.log(`Target: ${TESTS_DIR}`);
console.log("");

// Ensure tests directory exists
if (!fs.existsSync(TESTS_DIR)) {
  fs.mkdirSync(TESTS_DIR, { recursive: true });
}

// Get all files in root directory
const allFiles = fs
  .readdirSync(ROOT_DIR, { withFileTypes: true })
  .filter((dirent) => dirent.isFile())
  .map((dirent) => dirent.name);

console.log(`📋 Total files in root: ${allFiles.length}`);

// Comprehensive test file patterns
const testFilePatterns = [
  // Main test files
  /^test-.*\.(mjs|js)$/,

  // Simple test files
  /^simple-.*test.*\.(mjs|js)$/,
  /^simple-console-test\.(mjs|js)$/,
  /^simple-tenant-test\.(mjs|js)$/,

  // Debug files
  /^debug-.*\.(mjs|js)$/,

  // Create/verification files
  /^create-test.*\.(mjs|js)$/,
  /^create-valid-test.*\.(mjs|js)$/,
  /^verify-.*\.(mjs|js)$/,

  // Diagnostic files
  /^diagnose-.*\.(mjs|js)$/,
  /^dashboard-inspection.*\.(mjs|js)$/,

  // Setup files
  /^setup-.*\.(mjs|js)$/,

  // Update/fix files
  /^update-.*\.(mjs|js)$/,
  /^fix-.*\.(mjs|js)$/,
  /^replace-.*\.(mjs|js)$/,

  // Sample data files
  /^sample-.*\.(mjs|js)$/,
];

// Find all test files
const testFiles = allFiles.filter((fileName) => {
  return testFilePatterns.some((pattern) => pattern.test(fileName));
});

console.log(`📋 Test files found: ${testFiles.length}`);
testFiles.forEach((file) => console.log(`   - ${file}`));
console.log("");

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

// Process each file
testFiles.forEach((fileName) => {
  const sourcePath = path.join(ROOT_DIR, fileName);
  const targetPath = path.join(TESTS_DIR, fileName);

  try {
    // Skip if file doesn't exist in source
    if (!fs.existsSync(sourcePath)) {
      console.log(`⚠️  Source not found: ${fileName}`);
      skipCount++;
      return;
    }

    // Skip if file already exists in target
    if (fs.existsSync(targetPath)) {
      console.log(`⏭️  Already exists: ${fileName}`);
      skipCount++;
      return;
    }

    // Read source file
    const content = fs.readFileSync(sourcePath, "utf8");

    // Write to target
    fs.writeFileSync(targetPath, content, "utf8");

    // Verify write was successful
    if (fs.existsSync(targetPath)) {
      // Delete source file only after successful copy
      fs.unlinkSync(sourcePath);
      console.log(`✅ Moved: ${fileName}`);
      successCount++;
    } else {
      console.log(`❌ Failed to write: ${fileName}`);
      errorCount++;
    }
  } catch (error) {
    console.log(`❌ Error with ${fileName}: ${error.message}`);
    errorCount++;
  }
});

console.log("");
console.log("📊 MIGRATION SUMMARY");
console.log("===================");
console.log(`✅ Successfully moved: ${successCount} files`);
console.log(`⏭️  Skipped (already exists): ${skipCount} files`);
console.log(`❌ Errors: ${errorCount} files`);

// Final verification
console.log("");
console.log("📋 FINAL VERIFICATION");
console.log("=====================");

// Check how many test files remain in root
const remainingTestFiles = fs
  .readdirSync(ROOT_DIR, { withFileTypes: true })
  .filter((dirent) => dirent.isFile())
  .map((dirent) => dirent.name)
  .filter((fileName) =>
    testFilePatterns.some((pattern) => pattern.test(fileName))
  );

console.log(`📄 Test files remaining in root: ${remainingTestFiles.length}`);
if (remainingTestFiles.length > 0) {
  console.log("Remaining files:");
  remainingTestFiles.forEach((file) => console.log(`   - ${file}`));
}

// Show tests directory contents
const testsContents = fs.readdirSync(TESTS_DIR);
console.log(`📁 Files now in tests directory: ${testsContents.length}`);

// Categorize tests directory contents
const testFilesInTests = testsContents.filter((fileName) =>
  testFilePatterns.some((pattern) => pattern.test(fileName))
);
const existingTestFiles = testsContents.filter(
  (fileName) => !testFilePatterns.some((pattern) => pattern.test(fileName))
);

console.log(`   📄 Moved test files: ${testFilesInTests.length}`);
console.log(`   📄 Existing test files: ${existingTestFiles.length}`);

if (successCount > 0) {
  console.log("");
  console.log("🎉 TEST FILE MIGRATION COMPLETED!");
  console.log("==================================");
  console.log("✅ All test files have been organized into tests/ directory");
  console.log("✅ Root directory is now cleaner");
  console.log("✅ Tests can be run from centralized location");
  console.log("");
  console.log("📍 Example usage:");
  console.log("   node tests/test-responsive-layout.mjs");
  console.log("   node tests/test-features-endpoint.mjs");
  console.log("   node tests/test-modal-enhancements.mjs");
  console.log("   node tests/test-features-cycling.mjs");
} else {
  console.log("");
  console.log(
    "ℹ️  No files were moved (they may already be in tests directory)"
  );
}
