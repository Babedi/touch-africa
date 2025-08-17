#!/usr/bin/env node

import fs from "fs";
import path from "path";

console.log("🔧 Moving Debug Scripts to tests/debug/");
console.log("========================================");
console.log("");

const rootDir = process.cwd();
const testsDir = path.join(rootDir, "tests");
const debugDir = path.join(testsDir, "debug");

// Ensure debug directory exists
if (!fs.existsSync(debugDir)) {
  fs.mkdirSync(debugDir, { recursive: true });
  console.log("📁 Created tests/debug/ directory");
}

// List of debug scripts to move
const debugSourcesToMove = [
  // Root directory debug scripts
  { source: rootDir, pattern: /^debug.*\.(js|mjs)$/ },
  // Tests directory debug scripts
  { source: testsDir, pattern: /^debug.*\.(js|mjs)$/ },
];

let totalMoved = 0;
let totalErrors = 0;

for (const { source, pattern } of debugSourcesToMove) {
  console.log(
    `🔍 Checking ${source === rootDir ? "root" : "tests"} directory...`
  );

  try {
    const files = fs.readdirSync(source);
    const debugFiles = files.filter((file) => {
      const filePath = path.join(source, file);
      return fs.statSync(filePath).isFile() && pattern.test(file);
    });

    if (debugFiles.length === 0) {
      console.log(
        `   ⚠️  No debug files found in ${
          source === rootDir ? "root" : "tests"
        } directory`
      );
      continue;
    }

    console.log(`   📋 Found ${debugFiles.length} debug files:`);
    debugFiles.forEach((file) => console.log(`      - ${file}`));
    console.log("");

    for (const file of debugFiles) {
      const sourcePath = path.join(source, file);
      const targetPath = path.join(debugDir, file);

      try {
        // Check if target file already exists
        if (fs.existsSync(targetPath)) {
          fs.unlinkSync(targetPath);
          console.log(`   🗑️  Removed existing: ${file}`);
        }

        // Move the file
        fs.renameSync(sourcePath, targetPath);
        console.log(`   ✅ MOVED: ${file}`);
        totalMoved++;
      } catch (error) {
        console.log(`   ❌ ERROR moving ${file}:`, error.message);
        totalErrors++;
      }
    }

    console.log("");
  } catch (error) {
    console.log(
      `   ❌ ERROR reading ${source === rootDir ? "root" : "tests"} directory:`,
      error.message
    );
    totalErrors++;
  }
}

// Also check for any debugging-related test files that should be moved
console.log("🔍 Checking for debugging-related test files...");
const testsFiles = fs.readdirSync(testsDir);
const debugTestFiles = testsFiles.filter((file) => {
  const filePath = path.join(testsDir, file);
  return (
    fs.statSync(filePath).isFile() &&
    (file.includes("debug") || file.includes("debugging")) &&
    (file.endsWith(".mjs") || file.endsWith(".js"))
  );
});

if (debugTestFiles.length > 0) {
  console.log(
    `   📋 Found ${debugTestFiles.length} debugging-related test files:`
  );
  debugTestFiles.forEach((file) => console.log(`      - ${file}`));
  console.log("");

  for (const file of debugTestFiles) {
    const sourcePath = path.join(testsDir, file);
    const targetPath = path.join(debugDir, file);

    try {
      // Check if target file already exists
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
        console.log(`   🗑️  Removed existing: ${file}`);
      }

      // Move the file
      fs.renameSync(sourcePath, targetPath);
      console.log(`   ✅ MOVED: ${file}`);
      totalMoved++;
    } catch (error) {
      console.log(`   ❌ ERROR moving ${file}:`, error.message);
      totalErrors++;
    }
  }
} else {
  console.log("   ⚠️  No debugging-related test files found");
}

console.log("");
console.log("📊 Migration Summary");
console.log("==================");
console.log(`✅ Files moved: ${totalMoved}`);
console.log(`❌ Errors: ${totalErrors}`);
console.log(`📂 Target directory: tests/debug/`);

// Verify the move
console.log("");
console.log("🔍 Verification");
console.log("==============");

const debugFiles = fs.readdirSync(debugDir);
const debugScripts = debugFiles.filter(
  (file) => file.endsWith(".js") || file.endsWith(".mjs")
);

console.log(
  `📂 tests/debug/ now contains ${debugScripts.length} debug scripts:`
);
debugScripts.forEach((file) => console.log(`   - ${file}`));

// Check if any debug files remain in original locations
console.log("");
console.log("🔍 Checking for remaining debug files...");

const remainingInRoot = fs.readdirSync(rootDir).filter((file) => {
  const filePath = path.join(rootDir, file);
  return (
    fs.statSync(filePath).isFile() &&
    file.startsWith("debug") &&
    (file.endsWith(".js") || file.endsWith(".mjs"))
  );
});

const remainingInTests = fs.readdirSync(testsDir).filter((file) => {
  const filePath = path.join(testsDir, file);
  return (
    fs.statSync(filePath).isFile() &&
    (file.startsWith("debug") || file.includes("debug")) &&
    (file.endsWith(".js") || file.endsWith(".mjs"))
  );
});

if (remainingInRoot.length === 0 && remainingInTests.length === 0) {
  console.log("✅ SUCCESS: No debug scripts remain in original locations");
} else {
  if (remainingInRoot.length > 0) {
    console.log(`❌ ${remainingInRoot.length} debug files still in root:`);
    remainingInRoot.forEach((file) => console.log(`   - ${file}`));
  }
  if (remainingInTests.length > 0) {
    console.log(`❌ ${remainingInTests.length} debug files still in tests:`);
    remainingInTests.forEach((file) => console.log(`   - ${file}`));
  }
}

console.log("");
console.log("🏁 Debug script migration completed!");

// Self-cleanup
setTimeout(() => {
  try {
    fs.unlinkSync(__filename);
    console.log("✅ Migration script removed itself");
  } catch (error) {
    console.log("⚠️  Could not remove migration script");
  }
}, 1000);
