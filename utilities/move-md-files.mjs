#!/usr/bin/env node

import fs from "fs";
import path from "path";

console.log("📁 Moving Markdown Files to docs/generated/");
console.log("=============================================");
console.log("");

const rootDir = process.cwd();
const targetDir = path.join(rootDir, "docs", "generated");

// Get all files in root directory
const allFiles = fs.readdirSync(rootDir);

// Filter for .md files only (not directories)
const mdFiles = allFiles.filter((file) => {
  const filePath = path.join(rootDir, file);
  return fs.statSync(filePath).isFile() && file.endsWith(".md");
});

console.log(`🔍 Found ${mdFiles.length} Markdown files in root directory:`);
mdFiles.forEach((file) => console.log(`   - ${file}`));
console.log("");

let movedCount = 0;
let errorCount = 0;

console.log("📦 Moving files...");
console.log("");

for (const file of mdFiles) {
  const sourcePath = path.join(rootDir, file);
  const targetPath = path.join(targetDir, file);

  try {
    // Check if target file already exists
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
      console.log(`🗑️  Removed existing: ${file}`);
    }

    // Move the file
    fs.renameSync(sourcePath, targetPath);
    console.log(`✅ MOVED: ${file}`);
    movedCount++;
  } catch (error) {
    console.log(`❌ ERROR moving ${file}:`, error.message);
    errorCount++;
  }
}

console.log("");
console.log("📊 Migration Summary");
console.log("==================");
console.log(`✅ Files moved: ${movedCount}`);
console.log(`❌ Errors: ${errorCount}`);
console.log(`📂 Target directory: docs/generated/`);

// Verify the move
console.log("");
console.log("🔍 Verification");
console.log("==============");

const targetFiles = fs.readdirSync(targetDir);
const targetMdFiles = targetFiles.filter((file) => file.endsWith(".md"));

console.log(
  `📂 docs/generated/ now contains ${targetMdFiles.length} Markdown files`
);

// Check if any .md files remain in root
const remainingFiles = fs.readdirSync(rootDir);
const remainingMdFiles = remainingFiles.filter((file) => {
  const filePath = path.join(rootDir, file);
  return fs.statSync(filePath).isFile() && file.endsWith(".md");
});

if (remainingMdFiles.length === 0) {
  console.log("✅ SUCCESS: No Markdown files remain in root directory");
} else {
  console.log(`❌ ${remainingMdFiles.length} Markdown files still in root:`);
  remainingMdFiles.forEach((file) => console.log(`   - ${file}`));
}

console.log("");
console.log("🏁 Markdown file migration completed!");

// Self-cleanup
setTimeout(() => {
  try {
    fs.unlinkSync(__filename);
    console.log("✅ Migration script removed itself");
  } catch (error) {
    console.log("⚠️  Could not remove migration script");
  }
}, 1000);
