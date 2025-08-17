/**
 * VS Code Tasks Migration Script
 * Safely backup and replace tasks.json with clean version
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔄 VS Code Tasks Migration Script\n");

const tasksPath = path.join(__dirname, "..", ".vscode", "tasks.json");
const backupPath = path.join(__dirname, "..", ".vscode", "tasks.json.backup");
const cleanTasksPath = path.join(
  __dirname,
  "..",
  "docs",
  "clean-tasks-final.json"
);

try {
  // Step 1: Check if current tasks.json exists
  if (!fs.existsSync(tasksPath)) {
    console.log("❌ No tasks.json file found in .vscode directory");
    process.exit(1);
  }

  // Step 2: Create backup
  console.log("📄 Creating backup of current tasks.json...");
  fs.copyFileSync(tasksPath, backupPath);
  console.log(`✅ Backup created: ${backupPath}`);

  // Step 3: Read clean tasks template
  if (!fs.existsSync(cleanTasksPath)) {
    console.log(
      "❌ Clean tasks template not found at docs/clean-tasks-final.json"
    );
    process.exit(1);
  }

  const cleanTasks = fs.readFileSync(cleanTasksPath, "utf-8");

  // Step 4: Validate JSON
  try {
    JSON.parse(cleanTasks);
    console.log("✅ Clean tasks template is valid JSON");
  } catch (error) {
    console.log(`❌ Clean tasks template has JSON errors: ${error.message}`);
    process.exit(1);
  }

  // Step 5: Replace tasks.json
  console.log("🔄 Replacing tasks.json with clean version...");
  fs.writeFileSync(tasksPath, cleanTasks);
  console.log("✅ tasks.json successfully updated");

  // Step 6: Verify the replacement
  const newTasks = JSON.parse(fs.readFileSync(tasksPath, "utf-8"));
  console.log(`📊 New tasks.json contains ${newTasks.tasks.length} tasks`);

  // Step 7: List the new tasks
  console.log("\n📋 Available tasks:");
  newTasks.tasks.forEach((task, index) => {
    const group = task.group?.kind || task.group || "other";
    console.log(`${index + 1}. ${task.label} (${group})`);
  });

  console.log("\n🎉 Migration completed successfully!");
  console.log("\n💡 Next steps:");
  console.log(
    "1. Test the dev-start task: Ctrl+Shift+P > Tasks: Run Build Task"
  );
  console.log(
    "2. Test health-check: Ctrl+Shift+P > Tasks: Run Task > health-check"
  );
  console.log("3. If issues occur, restore from backup: tasks.json.backup");

  console.log("\n📈 Improvements:");
  console.log(`• Organized into logical groups`);
  console.log(`• Removed legacy and duplicate tasks`);
  console.log(`• Added proper task dependencies`);
  console.log(`• Improved presentation settings`);
  console.log(`• Modern VS Code task features`);
} catch (error) {
  console.error(`❌ Migration failed: ${error.message}`);

  // Attempt to restore backup if replacement failed
  if (fs.existsSync(backupPath)) {
    try {
      fs.copyFileSync(backupPath, tasksPath);
      console.log("🔄 Backup restored due to error");
    } catch (restoreError) {
      console.error(`❌ Could not restore backup: ${restoreError.message}`);
    }
  }

  process.exit(1);
}
