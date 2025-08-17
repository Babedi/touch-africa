/**
 * VS Code Tasks Cleanup Utility
 * Helps identify and remove legacy tasks from tasks.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🧹 VS Code Tasks Cleanup Utility\n");

const tasksPath = path.join(__dirname, "..", ".vscode", "tasks.json");

try {
  const tasksContent = fs.readFileSync(tasksPath, "utf-8");
  const lines = tasksContent.split("\n");

  console.log(`📊 Current tasks.json analysis:`);
  console.log(`• Total lines: ${lines.length}`);

  // Parse JSON to count tasks
  let tasksData;
  try {
    // Remove comments for parsing
    const cleanContent = tasksContent.replace(/\/\/.*$/gm, "");
    tasksData = JSON.parse(cleanContent);
    console.log(`• Total tasks: ${tasksData.tasks?.length || 0}`);
  } catch (parseError) {
    console.log(`• JSON parse error: ${parseError.message}`);
  }

  // Find duplicate task labels
  const labels = [];
  const duplicates = [];

  if (tasksData?.tasks) {
    tasksData.tasks.forEach((task) => {
      if (labels.includes(task.label)) {
        duplicates.push(task.label);
      } else {
        labels.push(task.label);
      }
    });
  }

  console.log(`• Duplicate tasks found: ${duplicates.length}`);
  if (duplicates.length > 0) {
    console.log(`  - ${duplicates.join(", ")}`);
  }

  // Find legacy patterns
  const legacyPatterns = [
    "curl-",
    "test-tenant-alarm",
    "run-admin-title-options-test",
    "move-test-html-files",
    "move-demo-html-files",
    "organize-non-production-files",
  ];

  const legacyTasks = labels.filter((label) =>
    legacyPatterns.some((pattern) => label.includes(pattern))
  );

  console.log(`• Legacy tasks found: ${legacyTasks.length}`);
  if (legacyTasks.length > 0) {
    console.log(
      `  - ${legacyTasks.slice(0, 10).join(", ")}${
        legacyTasks.length > 10 ? "..." : ""
      }`
    );
  }

  // Recommend current tasks based on package.json
  const packagePath = path.join(__dirname, "..", "package.json");
  let packageData;

  try {
    packageData = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
    console.log(`\n📋 Recommended tasks based on package.json scripts:`);

    Object.keys(packageData.scripts || {}).forEach((script) => {
      console.log(`• ${script} -> npm run ${script}`);
    });
  } catch (packageError) {
    console.log(`\n❌ Could not read package.json: ${packageError.message}`);
  }

  // Generate clean tasks.json structure
  console.log(`\n🎯 Generating clean tasks.json structure...`);

  const cleanTasks = {
    version: "2.0.0",
    tasks: [
      {
        label: "dev-start",
        type: "shell",
        command: "npm",
        args: ["run", "dev"],
        group: { kind: "build", isDefault: true },
        isBackground: true,
        problemMatcher: ["$tsc"],
      },
      {
        label: "generate-jwt-token",
        type: "shell",
        command: "npm",
        args: ["run", "make:token"],
        group: "build",
      },
      {
        label: "health-check",
        type: "shell",
        command: "powershell",
        args: [
          "-NoProfile",
          "-Command",
          "Invoke-WebRequest -Uri http://localhost:5000/internal/health -UseBasicParsing",
        ],
        group: "test",
      },
      {
        label: "test-three-card-system",
        type: "shell",
        command: "node",
        args: ["tests/test-three-card-system.mjs"],
        group: "test",
      },
      {
        label: "run-all-tests",
        type: "shell",
        command: "npm",
        args: ["run", "test:tenants"],
        group: "test",
        dependsOn: "generate-jwt-token",
      },
    ],
  };

  const cleanTasksPath = path.join(__dirname, "..", "docs", "clean-tasks.json");
  fs.writeFileSync(cleanTasksPath, JSON.stringify(cleanTasks, null, 2));

  console.log(`✅ Clean tasks template saved to: docs/clean-tasks.json`);
  console.log(
    `📏 Clean version: ${
      JSON.stringify(cleanTasks, null, 2).split("\n").length
    } lines`
  );
  console.log(
    `📉 Size reduction: ${Math.round(
      (1 -
        JSON.stringify(cleanTasks, null, 2).split("\n").length / lines.length) *
        100
    )}%`
  );

  console.log(`\n💡 Next Steps:`);
  console.log(`1. Backup current .vscode/tasks.json`);
  console.log(`2. Replace with clean structure from docs/clean-tasks.json`);
  console.log(`3. Customize for your specific needs`);
  console.log(
    `4. Test critical tasks: dev-start, health-check, generate-jwt-token`
  );
} catch (error) {
  console.error(`❌ Error analyzing tasks.json: ${error.message}`);
}
