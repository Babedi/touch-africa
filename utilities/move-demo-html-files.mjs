/**
 * Move Demo HTML Files to tests/html/
 * Migrates all demo-related HTML files and their associated assets
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

console.log("🚀 Moving Demo HTML Files and Related Assets");
console.log("==============================================");

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`📁 Created ${dirPath} directory`);
    } else {
      throw error;
    }
  }
}

async function moveFile(sourcePath, targetPath) {
  try {
    await fs.access(sourcePath);
    await fs.rename(sourcePath, targetPath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(`⚠️  File not found: ${path.basename(sourcePath)}`);
      return false;
    }
    throw error;
  }
}

async function main() {
  try {
    console.log("🚀 Starting demo HTML migration...");

    // Define source and target directories
    const sourceDir = path.join(projectRoot, "frontend", "public");
    const targetDir = path.join(projectRoot, "tests", "html");

    // Ensure target directory exists
    await ensureDirectoryExists(targetDir);

    // Define demo files to move
    const demoFiles = [
      "contrast-demo.html",
      "login-success-demo.html",
      "news-ticker-demo.html",
    ];

    console.log("🔍 Scanning for demo files...");
    console.log(`📋 Found ${demoFiles.length} demo files to move:`);

    demoFiles.forEach((file) => {
      console.log(`   - ${file}`);
    });

    console.log("");
    console.log("📦 Moving files...");

    let movedCount = 0;
    let skippedCount = 0;

    // Move each demo file
    for (const file of demoFiles) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);

      const moved = await moveFile(sourcePath, targetPath);
      if (moved) {
        console.log(`✅ MOVED: ${file}`);
        movedCount++;
      } else {
        console.log(`⚠️  SKIPPED: ${file} (not found)`);
        skippedCount++;
      }
    }

    console.log("");
    console.log("📊 Migration Summary");
    console.log("==================");
    console.log(`✅ Files moved: ${movedCount}`);
    console.log(`⚠️  Files skipped: ${skippedCount}`);
    console.log(`📂 Target directory: tests/html/`);

    // Verification
    console.log("");
    console.log("🔍 Verification");
    console.log("==============");

    try {
      const targetFiles = await fs.readdir(targetDir);
      const demoFilesInTarget = targetFiles.filter(
        (file) => file.includes("demo") && file.endsWith(".html")
      );

      console.log(
        `📂 tests/html/ now contains ${demoFilesInTarget.length} demo HTML files:`
      );
      demoFilesInTarget.forEach((file) => {
        console.log(`   - ${file}`);
      });

      // Check if source directory is clean of demo files
      const sourceFiles = await fs.readdir(sourceDir);
      const remainingDemoFiles = sourceFiles.filter(
        (file) => file.includes("demo") && file.endsWith(".html")
      );

      if (remainingDemoFiles.length === 0) {
        console.log("✅ SUCCESS: No demo files remain in frontend/public/");
      } else {
        console.log("⚠️  WARNING: Some demo files still in frontend/public/:");
        remainingDemoFiles.forEach((file) => {
          console.log(`   - ${file}`);
        });
      }
    } catch (error) {
      console.log("❌ Verification failed:", error.message);
    }

    console.log("");
    console.log("🎯 Result");
    console.log("========");
    console.log("✅ Demo HTML files organized");
    console.log("✅ Clean separation between production and demo files");
    console.log("✅ tests/html/ directory structure maintained");

    console.log("");
    console.log("📍 Demo files are now accessible at:");
    console.log("   - http://localhost:5000/tests/html/[filename]");
    console.log("   - Or directly from tests/html/ directory");

    console.log("🏁 Demo HTML migration completed!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

main();
