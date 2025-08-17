#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const filePath = join(
  process.cwd(),
  "frontend",
  "public",
  "professional-theme.css"
);

console.log("🎨 Fixing remaining AfricaTalking color references...");

try {
  let content = readFileSync(filePath, "utf8");

  // Color mapping: AfricaTalking colors → Clean professional colors
  const colorMappings = {
    "--at-orange-light": "--primary-blue-light",
    "--at-orange-dark": "--primary-blue-dark",
    "--at-orange": "--primary-blue",
    "--at-blue-light": "--accent-green-light",
    "--at-blue-dark": "--accent-green-dark",
    "--at-blue": "--accent-green",
    "--at-green-light": "--accent-green-light",
    "--at-green-dark": "--accent-green-dark",
    "--at-green": "--accent-green",
  };

  let replacementCount = 0;

  // Apply all replacements
  for (const [oldColor, newColor] of Object.entries(colorMappings)) {
    const regex = new RegExp(`var\\(${oldColor}\\)`, "g");
    const matches = content.match(regex);
    if (matches) {
      console.log(
        `  🔄 Replacing ${matches.length} instances of ${oldColor} → ${newColor}`
      );
      content = content.replace(regex, `var(${newColor})`);
      replacementCount += matches.length;
    }
  }

  // Write the updated content
  writeFileSync(filePath, content, "utf8");

  console.log(`✅ Successfully replaced ${replacementCount} color references`);
  console.log(
    "🎯 All AfricaTalking colors converted to clean professional palette"
  );

  // Verify no --at- references remain
  const remainingRefs = content.match(/--at-[a-zA-Z-]*/g);
  if (remainingRefs) {
    console.log("⚠️  Still found remaining --at- references:");
    remainingRefs.forEach((ref) => console.log(`     ${ref}`));
  } else {
    console.log(
      "✨ No remaining --at- references found - conversion complete!"
    );
  }
} catch (error) {
  console.error("❌ Error fixing colors:", error.message);
  process.exit(1);
}
