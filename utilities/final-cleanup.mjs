#!/usr/bin/env node

import fs from "fs";
import path from "path";

console.log("🧹 Final Test File Cleanup");
console.log("=========================");
console.log("");

const filesToRemove = [
  "cleanup-final-tests.mjs",
  "simple-console-test.js",
  "simple-tenant-test.js",
  "verify-migration.mjs",
];

const filesToMove = [
  "test-features-cycling.mjs",
  "test-features-endpoint.mjs",
  "test-modal-enhancements.mjs",
  "test-responsive-layout.mjs",
];

// Remove cleanup files
console.log("🗑️  Removing cleanup files...");
for (const file of filesToRemove) {
  const filePath = path.join(process.cwd(), file);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ REMOVED: ${file}`);
    }
  } catch (error) {
    console.log(`❌ ERROR removing ${file}:`, error.message);
  }
}

console.log("");

// Move remaining test files
console.log("📁 Moving remaining test files...");
for (const file of filesToMove) {
  const sourcePath = path.join(process.cwd(), file);
  const targetPath = path.join(process.cwd(), "tests", file);

  try {
    if (fs.existsSync(sourcePath)) {
      // Remove duplicate if exists
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
        console.log(`🗑️  Removed duplicate: ${file}`);
      }

      // Move file
      fs.renameSync(sourcePath, targetPath);
      console.log(`✅ MOVED: ${file}`);
    }
  } catch (error) {
    console.log(`❌ ERROR moving ${file}:`, error.message);
  }
}

console.log("");

// Final verification
console.log("📊 Final Verification");
console.log("==================");

const rootFiles = fs.readdirSync(process.cwd());
const testFilesInRoot = rootFiles.filter(
  (file) =>
    file.startsWith("test-") ||
    (file.includes("test") && (file.endsWith(".mjs") || file.endsWith(".js")))
);

if (testFilesInRoot.length === 0) {
  console.log("✅ SUCCESS: No test files remain in root directory");
} else {
  console.log(`❌ ${testFilesInRoot.length} test files still in root:`);
  testFilesInRoot.forEach((file) => console.log(`   - ${file}`));
}

const testsDir = path.join(process.cwd(), "tests");
const testsFiles = fs
  .readdirSync(testsDir)
  .filter((file) => !fs.statSync(path.join(testsDir, file)).isDirectory());

console.log(`📂 tests/ directory now contains ${testsFiles.length} files`);

console.log("");
console.log("🎉 Final cleanup completed!");

// Self-remove this cleanup script
setTimeout(() => {
  try {
    fs.unlinkSync(__filename);
    console.log("✅ Cleanup script removed itself");
  } catch (error) {
    console.log("⚠️  Could not remove cleanup script");
  }
}, 1000);
