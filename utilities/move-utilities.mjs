import fs from "fs";
import path from "path";

console.log("🔧 Moving Utility Scripts to utilities/");
console.log("=========================================");

const rootDir = process.cwd();
const utilitiesDir = path.join(rootDir, "utilities");

// Create utilities directory if it doesn't exist
if (!fs.existsSync(utilitiesDir)) {
  fs.mkdirSync(utilitiesDir, { recursive: true });
  console.log("📁 Created utilities/ directory");
}

// List of utility scripts to move from root to utilities/
const utilityScripts = [
  // Migration and cleanup scripts
  "final-cleanup.mjs",
  "move-debug-scripts.mjs",
  "move-md-files.mjs",

  // Fix and update scripts
  "fix-remaining-colors.mjs",
  "fix-summary.mjs",
  "replace-all-icons.mjs",
  "update-feature-icons.mjs",

  // PowerShell scripts
  "final-move-tests.ps1",
];

let moved = 0;
let errors = 0;

console.log("\n🔍 Checking root directory...");
console.log(`📋 Found ${utilityScripts.length} utility scripts to move:`);
utilityScripts.forEach((script) => console.log(`   - ${script}`));

console.log("\n📦 Moving files...\n");

utilityScripts.forEach((script) => {
  const sourcePath = path.join(rootDir, script);
  const targetPath = path.join(utilitiesDir, script);

  try {
    if (fs.existsSync(sourcePath)) {
      // Check if target already exists
      if (fs.existsSync(targetPath)) {
        console.log(`🗑️  Removed duplicate: ${script}`);
        fs.unlinkSync(targetPath);
      }

      // Move the file
      fs.renameSync(sourcePath, targetPath);
      console.log(`✅ MOVED: ${script}`);
      moved++;
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
console.log(`✅ Files moved: ${moved}`);
console.log(`❌ Errors: ${errors}`);
console.log(`📂 Target directory: utilities/`);

// Verification
console.log("\n🔍 Verification");
console.log("==============");

try {
  const utilitiesFiles = fs.readdirSync(utilitiesDir);
  const utilityFiles = utilitiesFiles.filter(
    (file) =>
      file.endsWith(".mjs") || file.endsWith(".js") || file.endsWith(".ps1")
  );

  console.log(
    `📂 utilities/ now contains ${utilityFiles.length} utility scripts:`
  );
  utilityFiles.forEach((file) => console.log(`   - ${file}`));

  // Check if any utility scripts remain in root
  const rootFiles = fs.readdirSync(rootDir);
  const remainingUtilities = utilityScripts.filter((script) =>
    rootFiles.includes(script)
  );

  if (remainingUtilities.length === 0) {
    console.log("✅ SUCCESS: No utility scripts remain in root directory");
  } else {
    console.log(
      `⚠️  WARNING: ${remainingUtilities.length} utility scripts still in root:`
    );
    remainingUtilities.forEach((script) => console.log(`   - ${script}`));
  }
} catch (error) {
  console.log(`❌ Verification failed: ${error.message}`);
}

console.log("\n🏁 Utility script migration completed!");

// Self-remove this migration script
try {
  fs.unlinkSync(__filename);
  console.log("✅ Migration script removed itself");
} catch (error) {
  console.log("⚠️  Could not remove migration script");
}
