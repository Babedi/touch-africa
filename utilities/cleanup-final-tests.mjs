#!/usr/bin/env node

import fs from "fs";
import path from "path";

console.log("🧹 Cleaning up final test files...");

const filesToMove = [
  "test-features-cycling.mjs",
  "test-features-endpoint.mjs",
  "test-modal-enhancements.mjs",
  "test-responsive-layout.mjs",
];

for (const file of filesToMove) {
  const sourcePath = path.join(process.cwd(), file);
  const targetPath = path.join(process.cwd(), "tests", file);

  try {
    // Check if source exists
    if (fs.existsSync(sourcePath)) {
      // Remove target if it exists (to avoid conflicts)
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
        console.log(`🗑️  Removed duplicate: ${file}`);
      }

      // Move file
      fs.renameSync(sourcePath, targetPath);
      console.log(`✅ MOVED: ${file}`);
    } else {
      console.log(`⚠️  NOT FOUND: ${file}`);
    }
  } catch (error) {
    console.log(`❌ ERROR moving ${file}:`, error.message);
  }
}

console.log("🏁 Cleanup completed!");
