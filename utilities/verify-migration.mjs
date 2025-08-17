#!/usr/bin/env node

import fs from "fs";
import path from "path";

console.log("📊 TEST FILE MIGRATION VERIFICATION REPORT");
console.log("==========================================");
console.log("");

// Check root directory for remaining test files
console.log("🔍 Checking root directory for test files...");
const rootFiles = fs.readdirSync(process.cwd());
const testFilesInRoot = rootFiles.filter(
  (file) =>
    file.startsWith("test-") ||
    (file.includes("test") && (file.endsWith(".mjs") || file.endsWith(".js")))
);

if (testFilesInRoot.length > 0) {
  console.log(`❌ Found ${testFilesInRoot.length} test files still in root:`);
  testFilesInRoot.forEach((file) => console.log(`   - ${file}`));
} else {
  console.log("✅ NO test files found in root directory");
}

console.log("");

// Check tests directory
console.log("📂 Checking tests/ directory...");
const testsDir = path.join(process.cwd(), "tests");
if (fs.existsSync(testsDir)) {
  const testsFiles = fs.readdirSync(testsDir);
  const testFilesInTests = testsFiles.filter(
    (file) => !fs.statSync(path.join(testsDir, file)).isDirectory()
  );

  console.log(`✅ tests/ directory contains ${testFilesInTests.length} files`);

  // Count specific types
  const mjsFiles = testFilesInTests.filter((f) => f.endsWith(".mjs")).length;
  const jsFiles = testFilesInTests.filter((f) => f.endsWith(".js")).length;
  const psFiles = testFilesInTests.filter((f) => f.endsWith(".ps1")).length;

  console.log(`   📊 Breakdown:`);
  console.log(`      - .mjs files: ${mjsFiles}`);
  console.log(`      - .js files: ${jsFiles}`);
  console.log(`      - .ps1 files: ${psFiles}`);
  console.log(
    `      - Other files: ${
      testFilesInTests.length - mjsFiles - jsFiles - psFiles
    }`
  );
} else {
  console.log("❌ tests/ directory does not exist");
}

console.log("");

// Migration summary
console.log("📋 MIGRATION SUMMARY");
console.log("==================");
if (testFilesInRoot.length === 0) {
  console.log("🎉 MIGRATION COMPLETE!");
  console.log("✅ All test files successfully moved to tests/ directory");
  console.log("✅ Root directory is now clean of test files");
} else {
  console.log("⚠️  MIGRATION INCOMPLETE");
  console.log(
    `❌ ${testFilesInRoot.length} test files remain in root directory`
  );
  console.log("🔧 Manual cleanup may be required");
}

console.log("");
console.log("🏁 Verification completed");
