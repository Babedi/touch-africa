/**
 * Move All Test Files to Tests Directory
 * This script will systematically move all test files from root to tests/ directory
 */

import fs from "fs";
import path from "path";

const rootDir = "c:\\Users\\Development\\Desktop\\TouchAfrica";
const testsDir = path.join(rootDir, "tests");

console.log("🎯 MOVING ALL TEST FILES TO TESTS DIRECTORY");
console.log("");

// Ensure tests directory exists
if (!fs.existsSync(testsDir)) {
  fs.mkdirSync(testsDir, { recursive: true });
  console.log("✅ Created tests directory");
}

// Get all files in root directory
const rootFiles = fs.readdirSync(rootDir);

// Filter test files and related files
const testPatterns = [
  /^test-.*\.(mjs|js)$/,
  /^simple-.*test.*\.js$/,
  /^debug-.*\.js$/,
  /^create-test.*\.mjs$/,
  /^create-valid-test.*\.mjs$/,
  /^verify-.*\.mjs$/,
  /^diagnose-.*\.mjs$/,
  /^dashboard-inspection.*\.mjs$/,
  /^debug-admin.*\.mjs$/,
];

const filesToMove = [];

rootFiles.forEach((file) => {
  const isTestFile = testPatterns.some((pattern) => pattern.test(file));
  if (isTestFile) {
    filesToMove.push(file);
  }
});

console.log(`📋 Found ${filesToMove.length} test files to move:`);
filesToMove.forEach((file) => console.log(`   - ${file}`));
console.log("");

let moveCount = 0;
let errorCount = 0;

// Move each file
filesToMove.forEach((fileName) => {
  const sourcePath = path.join(rootDir, fileName);
  const targetPath = path.join(testsDir, fileName);

  try {
    // Check if file exists in source
    if (fs.existsSync(sourcePath)) {
      // Read file content
      const content = fs.readFileSync(sourcePath, "utf8");

      // Write to target
      fs.writeFileSync(targetPath, content, "utf8");

      // Delete from source (only if target write was successful)
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(sourcePath);
        console.log(`✅ Moved: ${fileName}`);
        moveCount++;
      } else {
        console.log(`❌ Failed to create target: ${fileName}`);
        errorCount++;
      }
    } else {
      console.log(`⚠️ Source file not found: ${fileName}`);
    }
  } catch (error) {
    console.log(`❌ Error moving ${fileName}: ${error.message}`);
    errorCount++;
  }
});

console.log("");
console.log("📋 MOVE OPERATION SUMMARY:");
console.log(`   ✅ Successfully moved: ${moveCount} files`);
console.log(`   ❌ Errors: ${errorCount} files`);
console.log(`   📁 Target directory: ${testsDir}`);

if (moveCount > 0) {
  console.log("");
  console.log("🎉 Test files have been organized into the tests/ directory!");
  console.log("   You can now run tests from the tests/ directory");
  console.log("   Example: node tests/test-responsive-layout.mjs");
}

// List final contents of tests directory
console.log("");
console.log("📋 Current contents of tests directory:");
const testsContents = fs.readdirSync(testsDir);
testsContents.forEach((item) => {
  const itemPath = path.join(testsDir, item);
  const isDir = fs.statSync(itemPath).isDirectory();
  console.log(`   ${isDir ? "📁" : "📄"} ${item}`);
});
