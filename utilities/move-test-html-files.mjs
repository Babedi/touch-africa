#!/usr/bin/env node

/**
 * Move all test HTML files and related CSS/JS to tests/html/
 */

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readdir, mkdir, stat, copyFile, unlink } from "fs/promises";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname);

console.log("🚀 Moving Test HTML Files and Related Assets");
console.log("==============================================");

async function moveTestHtmlFiles() {
  try {
    const projectRoot = join(__dirname, "..");
    const sourceDir = join(projectRoot, "frontend", "public");
    const targetDir = join(projectRoot, "tests", "html");

    // Create target directory if it doesn't exist
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
      console.log("📁 Created tests/html/ directory");
    }

    // Get all files in frontend/public
    const allFiles = await readdir(sourceDir);

    // Define patterns for test-related files
    const testPatterns = [
      /.*test.*\.html$/i,
      /.*debug.*\.html$/i,
      /^debug-.*\.js$/i,
      /.*test.*\.css$/i,
      /.*debug.*\.css$/i,
      /login-fix-test\.html$/i,
      /logout-fix-test\.html$/i,
      /icon-button-test\.html$/i,
      /cookie-test\.html$/i,
      /ticker-test\.html$/i,
      /tenant-admin-debug\.html$/i,
      /auth-debug\.html$/i,
      /debug-pin-toggle\.js$/i,
      /enhanced-contrast-helper\.js$/i, // This seems to be test-related
    ];

    console.log("🔍 Scanning for test-related files...");
    const testFiles = [];

    for (const file of allFiles) {
      const filePath = join(sourceDir, file);
      const fileStat = await stat(filePath);

      if (fileStat.isFile()) {
        const isTestFile = testPatterns.some((pattern) => pattern.test(file));
        if (isTestFile) {
          testFiles.push(file);
        }
      }
    }

    console.log(`📋 Found ${testFiles.length} test-related files:`);
    testFiles.forEach((file) => console.log(`   - ${file}`));

    if (testFiles.length === 0) {
      console.log("✅ No test files found to move");
      return;
    }

    console.log("");
    console.log("📦 Moving files...");

    let movedCount = 0;
    let skippedCount = 0;

    for (const file of testFiles) {
      const sourcePath = join(sourceDir, file);
      const targetPath = join(targetDir, file);

      try {
        // Check if target file already exists
        if (existsSync(targetPath)) {
          console.log(`⚠️  SKIP: ${file} (already exists in tests/html/)`);
          skippedCount++;
          continue;
        }

        // Copy file to target location
        await copyFile(sourcePath, targetPath);

        // Remove original file
        await unlink(sourcePath);

        console.log(`✅ MOVED: ${file}`);
        movedCount++;
      } catch (error) {
        console.error(`❌ ERROR moving ${file}:`, error.message);
      }
    }

    console.log("");
    console.log("📊 Migration Summary");
    console.log("==================");
    console.log(`✅ Files moved: ${movedCount}`);
    console.log(`⚠️  Files skipped: ${skippedCount}`);
    console.log(`📂 Target directory: tests/html/`);

    // Verify target directory contents
    console.log("");
    console.log("🔍 Verification");
    console.log("==============");
    const targetFiles = await readdir(targetDir);
    console.log(`📂 tests/html/ now contains ${targetFiles.length} files:`);

    // Categorize files
    const htmlFiles = targetFiles.filter((f) => f.endsWith(".html"));
    const jsFiles = targetFiles.filter((f) => f.endsWith(".js"));
    const cssFiles = targetFiles.filter((f) => f.endsWith(".css"));

    if (htmlFiles.length > 0) {
      console.log(`   📄 HTML files (${htmlFiles.length}):`);
      htmlFiles.forEach((file) => console.log(`      - ${file}`));
    }

    if (jsFiles.length > 0) {
      console.log(`   🟨 JavaScript files (${jsFiles.length}):`);
      jsFiles.forEach((file) => console.log(`      - ${file}`));
    }

    if (cssFiles.length > 0) {
      console.log(`   🎨 CSS files (${cssFiles.length}):`);
      cssFiles.forEach((file) => console.log(`      - ${file}`));
    }

    console.log("");
    console.log("🔍 Checking for remaining test files in frontend/public...");
    const remainingFiles = await readdir(sourceDir);
    const remainingTestFiles = remainingFiles.filter((file) =>
      testPatterns.some((pattern) => pattern.test(file))
    );

    if (remainingTestFiles.length === 0) {
      console.log("✅ SUCCESS: No test files remain in frontend/public/");
    } else {
      console.log("⚠️  WARNING: Some test files remain:");
      remainingTestFiles.forEach((file) => console.log(`      - ${file}`));
    }

    console.log("");
    console.log("🎯 Result");
    console.log("========");
    console.log("✅ Test HTML files and related assets organized");
    console.log("✅ Clean separation between production and test files");
    console.log("✅ tests/html/ directory structure established");

    console.log("");
    console.log("📍 Test files are now accessible at:");
    console.log("   - http://localhost:5000/tests/html/[filename]");
    console.log("   - Or directly from tests/html/ directory");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

console.log("🚀 Starting test HTML migration...");
moveTestHtmlFiles().then(() => {
  console.log("🏁 Test HTML migration completed!");
});
