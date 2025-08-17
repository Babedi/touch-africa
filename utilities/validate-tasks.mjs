/**
 * VS Code Tasks Validation Script
 * Verify tasks.json structure and functionality
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔍 VS Code Tasks Validation\n");

const tasksPath = path.join(__dirname, "..", ".vscode", "tasks.json");

try {
  if (!fs.existsSync(tasksPath)) {
    console.log("❌ No tasks.json file found");
    process.exit(1);
  }

  const tasksContent = fs.readFileSync(tasksPath, "utf-8");
  const tasks = JSON.parse(tasksContent);

  console.log("✅ tasks.json is valid JSON");
  console.log(`📊 Total tasks: ${tasks.tasks.length}`);

  // Group tasks by category
  const tasksByGroup = {};
  tasks.tasks.forEach((task) => {
    const group = task.group?.kind || task.group || "other";
    if (!tasksByGroup[group]) tasksByGroup[group] = [];
    tasksByGroup[group].push(task.label);
  });

  console.log("\n📋 Tasks by category:");
  Object.entries(tasksByGroup).forEach(([group, taskList]) => {
    console.log(`\n🏷️  ${group.toUpperCase()} (${taskList.length} tasks):`);
    taskList.forEach((label) => console.log(`   • ${label}`));
  });

  // Check for critical tasks
  const criticalTasks = [
    "dev-start",
    "health-check",
    "generate-jwt-token",
    "test-admin-login",
    "test-tenant-endpoints",
  ];

  console.log("\n🎯 Critical task validation:");
  criticalTasks.forEach((taskName) => {
    const found = tasks.tasks.find((t) => t.label === taskName);
    if (found) {
      console.log(`✅ ${taskName} - Found`);
    } else {
      console.log(`❌ ${taskName} - Missing`);
    }
  });

  // Check task structure
  console.log("\n🔧 Task structure validation:");
  let validTasks = 0;
  let issues = [];

  tasks.tasks.forEach((task) => {
    if (task.label && task.type && task.command) {
      validTasks++;
    } else {
      issues.push(`${task.label || "Unnamed"} - Missing required fields`);
    }
  });

  console.log(`✅ Valid tasks: ${validTasks}/${tasks.tasks.length}`);
  if (issues.length > 0) {
    console.log("⚠️  Issues found:");
    issues.forEach((issue) => console.log(`   • ${issue}`));
  }

  console.log("\n🎉 Validation complete!");
} catch (error) {
  console.error(`❌ Validation failed: ${error.message}`);
  process.exit(1);
}
