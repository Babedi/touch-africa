import fs from "fs";
import path from "path";

console.log("🔧 Moving Remaining Utility Scripts to utilities/");
console.log("===================================================");

const rootDir = process.cwd();
const utilitiesDir = path.join(rootDir, "utilities");

// Ensure utilities directory exists
if (!fs.existsSync(utilitiesDir)) {
  fs.mkdirSync(utilitiesDir, { recursive: true });
  console.log("📁 Created utilities/ directory");
}

// List of utility scripts in root that need to be moved
const utilityScriptsInRoot = [
  // Migration scripts
  "cleanup-final-tests.mjs",
  "final-cleanup.mjs",
  "final-migration.mjs",
  "move-debug-scripts.mjs",
  "move-md-files.mjs",
  "move-utilities.mjs",
  "verify-migration.mjs",

  // PowerShell scripts
  "final-move-tests.ps1",
  "migrate-test-files.ps1",

  // Markdown files that should be in docs/generated
  "TEST_FILE_MIGRATION_COMPLETE.md",
  "TEST_MIGRATION_COMPLETE.md",
];

let moved = 0;
let errors = 0;
let mdFilesMoved = 0;

console.log("\n🔍 Checking root directory for utility scripts...");

// First, check what actually exists in root
const rootFiles = fs.readdirSync(rootDir);
const existingUtilityScripts = utilityScriptsInRoot.filter((script) =>
  rootFiles.includes(script)
);

console.log(
  `📋 Found ${existingUtilityScripts.length} utility scripts/files to move:`
);
existingUtilityScripts.forEach((script) => console.log(`   - ${script}`));

console.log("\n📦 Moving files...\n");

existingUtilityScripts.forEach((script) => {
  const sourcePath = path.join(rootDir, script);

  // Determine target directory based on file type
  let targetDir, targetPath;

  if (script.endsWith(".md")) {
    // Move markdown files to docs/generated
    targetDir = path.join(rootDir, "docs", "generated");
    targetPath = path.join(targetDir, script);

    // Ensure docs/generated directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
  } else {
    // Move script files to utilities
    targetDir = utilitiesDir;
    targetPath = path.join(utilitiesDir, script);
  }

  try {
    if (fs.existsSync(sourcePath)) {
      // Check if target already exists
      if (fs.existsSync(targetPath)) {
        console.log(`🗑️  Removed duplicate: ${script}`);
        fs.unlinkSync(targetPath);
      }

      // Move the file
      fs.renameSync(sourcePath, targetPath);

      if (script.endsWith(".md")) {
        console.log(`✅ MOVED TO DOCS: ${script}`);
        mdFilesMoved++;
      } else {
        console.log(`✅ MOVED TO UTILITIES: ${script}`);
        moved++;
      }
    } else {
      console.log(`⚠️  SKIP: ${script} (not found in root)`);
    }
  } catch (error) {
    console.log(`❌ ERROR moving ${script}: ${error.message}`);
    errors++;
  }
});

console.log("\n📊 Migration Summary");
console.log("==================");
console.log(`✅ Scripts moved to utilities/: ${moved}`);
console.log(`✅ Markdown files moved to docs/generated/: ${mdFilesMoved}`);
console.log(`❌ Errors: ${errors}`);

// Verification
console.log("\n🔍 Verification");
console.log("==============");

try {
  // Check utilities directory
  const utilitiesFiles = fs.readdirSync(utilitiesDir);
  const utilityScripts = utilitiesFiles.filter(
    (file) =>
      file.endsWith(".mjs") || file.endsWith(".js") || file.endsWith(".ps1")
  );

  console.log(
    `📂 utilities/ now contains ${utilityScripts.length} utility scripts:`
  );
  utilityScripts.forEach((file) => console.log(`   - ${file}`));

  // Check docs/generated directory
  const docsDir = path.join(rootDir, "docs", "generated");
  if (fs.existsSync(docsDir)) {
    const docsFiles = fs.readdirSync(docsDir);
    const mdFiles = docsFiles.filter((file) => file.endsWith(".md"));
    console.log(
      `\n📂 docs/generated/ contains ${mdFiles.length} markdown files`
    );
  }

  // Check for remaining utility scripts in root
  const remainingRootFiles = fs.readdirSync(rootDir);
  const remainingUtilities = utilityScriptsInRoot.filter((script) =>
    remainingRootFiles.includes(script)
  );

  if (remainingUtilities.length === 0) {
    console.log("\n✅ SUCCESS: No utility scripts remain in root directory");
  } else {
    console.log(
      `\n⚠️  WARNING: ${remainingUtilities.length} utility scripts still in root:`
    );
    remainingUtilities.forEach((script) => console.log(`   - ${script}`));
  }
} catch (error) {
  console.log(`❌ Verification failed: ${error.message}`);
}

console.log("\n🏁 Utility script migration completed!");

// Self-remove this migration script after a brief delay
setTimeout(() => {
  try {
    fs.unlinkSync(__filename);
    console.log("✅ Migration script removed itself");
  } catch (error) {
    console.log("⚠️  Could not remove migration script");
  }
}, 1000);
