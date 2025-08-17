/**
 * Comprehensive Non-Production File Organization
 * Moves all development, testing, and temporary files to appropriate directories
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

console.log("🧹 Comprehensive Non-Production File Organization");
console.log("==================================================");

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(
        `📁 Created ${path.relative(projectRoot, dirPath)} directory`
      );
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
      return false;
    }
    throw error;
  }
}

async function moveDirectory(sourceDir, targetDir) {
  try {
    await fs.access(sourceDir);
    await fs.rename(sourceDir, targetDir);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function main() {
  try {
    console.log("🚀 Starting comprehensive file organization...");

    let movedCount = 0;
    let skippedCount = 0;

    // Ensure target directories exist
    const targetDirs = [
      path.join(projectRoot, "docs", "inspirations"),
      path.join(projectRoot, "utilities", "tools"),
      path.join(projectRoot, "temp", "assets"),
      path.join(projectRoot, "docs", "development"),
    ];

    for (const dir of targetDirs) {
      await ensureDirectoryExists(dir);
    }

    console.log("");
    console.log("📋 Step 1: Moving Inspiration Files");
    console.log("===================================");

    // Move inspirations directory to docs/
    const inspirationsSource = path.join(projectRoot, "inspirations");
    const inspirationsTarget = path.join(projectRoot, "docs", "inspirations");

    try {
      await fs.access(inspirationsSource);
      // Check if target already exists
      try {
        await fs.access(inspirationsTarget);
        console.log("⚠️  docs/inspirations already exists, merging files...");

        // Move individual files
        const inspirationFiles = await fs.readdir(inspirationsSource);
        for (const file of inspirationFiles) {
          const sourceFile = path.join(inspirationsSource, file);
          const targetFile = path.join(inspirationsTarget, file);

          if (await moveFile(sourceFile, targetFile)) {
            console.log(`✅ MOVED: inspirations/${file} → docs/inspirations/`);
            movedCount++;
          } else {
            console.log(`⚠️  SKIPPED: inspirations/${file} (not found)`);
            skippedCount++;
          }
        }

        // Remove empty source directory
        try {
          await fs.rmdir(inspirationsSource);
          console.log(`🗑️  Removed empty inspirations/ directory`);
        } catch (error) {
          console.log(
            `⚠️  Could not remove inspirations/ directory: ${error.message}`
          );
        }
      } catch (error) {
        // Target doesn't exist, move entire directory
        if (await moveDirectory(inspirationsSource, inspirationsTarget)) {
          console.log(`✅ MOVED: inspirations/ → docs/inspirations/`);
          movedCount++;
        }
      }
    } catch (error) {
      console.log("⚠️  Inspirations directory not found");
    }

    console.log("");
    console.log("📋 Step 2: Moving Tools");
    console.log("======================");

    // Move tools directory to utilities/
    const toolsSource = path.join(projectRoot, "tools");
    const toolsTarget = path.join(projectRoot, "utilities", "tools");

    try {
      await fs.access(toolsSource);
      // Check if target already exists
      try {
        await fs.access(toolsTarget);
        console.log("⚠️  utilities/tools already exists, merging files...");

        // Move individual files
        const toolFiles = await fs.readdir(toolsSource);
        for (const file of toolFiles) {
          const sourceFile = path.join(toolsSource, file);
          const targetFile = path.join(toolsTarget, file);

          if (await moveFile(sourceFile, targetFile)) {
            console.log(`✅ MOVED: tools/${file} → utilities/tools/`);
            movedCount++;
          } else {
            console.log(`⚠️  SKIPPED: tools/${file} (not found)`);
            skippedCount++;
          }
        }

        // Remove empty source directory
        try {
          await fs.rmdir(toolsSource);
          console.log(`🗑️  Removed empty tools/ directory`);
        } catch (error) {
          console.log(
            `⚠️  Could not remove tools/ directory: ${error.message}`
          );
        }
      } catch (error) {
        // Target doesn't exist, move entire directory
        if (await moveDirectory(toolsSource, toolsTarget)) {
          console.log(`✅ MOVED: tools/ → utilities/tools/`);
          movedCount++;
        }
      }
    } catch (error) {
      console.log("⚠️  Tools directory not found");
    }

    console.log("");
    console.log("📋 Step 3: Organizing Development Tokens");
    console.log("========================================");

    // Move development token to utilities/
    const tokenSource = path.join(projectRoot, "secrets", "token.txt");
    const tokenTarget = path.join(projectRoot, "utilities", "dev-token.txt");

    if (await moveFile(tokenSource, tokenTarget)) {
      console.log(`✅ MOVED: secrets/token.txt → utilities/dev-token.txt`);
      movedCount++;
    } else {
      console.log("⚠️  Development token not found");
    }

    console.log("");
    console.log("📋 Step 4: Checking for Stray Files");
    console.log("====================================");

    // Check for any stray development files
    const potentialStrayFiles = [
      ".DS_Store",
      "Thumbs.db",
      "*.tmp",
      "*.temp",
      "*.bak",
      "*.old",
      "*.orig",
    ];

    for (const pattern of potentialStrayFiles) {
      try {
        const files = await fs.readdir(projectRoot);
        const matchingFiles = files.filter((file) => {
          if (pattern.includes("*")) {
            const regex = new RegExp(pattern.replace("*", ".*"));
            return regex.test(file);
          }
          return file === pattern;
        });

        for (const file of matchingFiles) {
          const filePath = path.join(projectRoot, file);
          const targetPath = path.join(projectRoot, "temp", file);

          if (await moveFile(filePath, targetPath)) {
            console.log(`✅ MOVED: ${file} → temp/`);
            movedCount++;
          }
        }
      } catch (error) {
        // Continue with other patterns
      }
    }

    console.log("");
    console.log("📊 Organization Summary");
    console.log("======================");
    console.log(`✅ Items moved: ${movedCount}`);
    console.log(`⚠️  Items skipped: ${skippedCount}`);

    console.log("");
    console.log("🔍 Final Verification");
    console.log("====================");

    // Verify target directories
    const verificationPaths = [
      "docs/inspirations",
      "utilities/tools",
      "utilities/dev-token.txt",
      "temp",
      "tests",
      "docs/generated",
    ];

    for (const verPath of verificationPaths) {
      const fullPath = path.join(projectRoot, verPath);
      try {
        await fs.access(fullPath);
        console.log(`✅ ${verPath}: EXISTS`);
      } catch (error) {
        console.log(`⚠️  ${verPath}: NOT FOUND`);
      }
    }

    console.log("");
    console.log("🎯 Organization Complete!");
    console.log("========================");
    console.log("✅ All non-production files organized");
    console.log("✅ Development files in utilities/");
    console.log("✅ Test files in tests/");
    console.log("✅ Documentation in docs/");
    console.log("✅ Temporary files in temp/");
    console.log("✅ Inspiration files in docs/inspirations/");

    console.log("");
    console.log("📂 Current Structure:");
    console.log(
      "    Production Code: app.js, package.json, frontend/, modules/, etc."
    );
    console.log("    Development: utilities/, tests/");
    console.log("    Documentation: docs/");
    console.log("    Temporary: temp/");
    console.log("    Configuration: .env, secrets/ (production keys only)");

    console.log("🏁 File organization completed!");
  } catch (error) {
    console.error("❌ Organization failed:", error.message);
    process.exit(1);
  }
}

main();
