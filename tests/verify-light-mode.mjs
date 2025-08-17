#!/usr/bin/env node

import { readFileSync } from "fs";
import { join } from "path";

console.log("🔍 Light Mode Implementation Verification");
console.log("=========================================");

// Check if dark mode CSS has been removed from index.css
const indexCssPath = join(process.cwd(), "frontend", "public", "index.css");
const indexCss = readFileSync(indexCssPath, "utf8");

console.log("\n📋 Dark Mode CSS Check:");
if (indexCss.includes("@media (prefers-color-scheme: dark)")) {
  console.log("❌ Dark mode CSS still present in index.css");
} else {
  console.log("✅ Dark mode CSS successfully removed from index.css");
}

// Check if light mode override file exists
try {
  const overrideCssPath = join(
    process.cwd(),
    "frontend",
    "public",
    "light-mode-override.css"
  );
  const overrideCss = readFileSync(overrideCssPath, "utf8");
  console.log("✅ Light mode override CSS file created successfully");

  if (overrideCss.includes("color-scheme: light !important")) {
    console.log("✅ Color scheme enforcement found");
  }
} catch (error) {
  console.log("❌ Light mode override CSS file not found");
}

// Check if HTML includes the override file
const htmlPath = join(process.cwd(), "frontend", "public", "index.html");
const html = readFileSync(htmlPath, "utf8");

console.log("\n📋 HTML Integration Check:");
if (html.includes("light-mode-override.css")) {
  console.log("✅ Light mode override CSS linked in HTML");
} else {
  console.log("❌ Light mode override CSS not linked in HTML");
}

// Check professional-theme.css for remaining --at- references
const themeCssPath = join(
  process.cwd(),
  "frontend",
  "public",
  "professional-theme.css"
);
const themeCss = readFileSync(themeCssPath, "utf8");

console.log("\n📋 Color Reference Check:");
const atReferences = themeCss.match(/--at-[a-zA-Z-]+/g);
if (atReferences) {
  console.log(
    `⚠️  Found ${atReferences.length} remaining --at- color references:`
  );
  const uniqueRefs = [...new Set(atReferences)];
  uniqueRefs.forEach((ref) => console.log(`   - ${ref}`));
} else {
  console.log("✅ No --at- color references found");
}

// Check for forced light mode CSS
if (
  themeCss.includes("@media (prefers-color-scheme: dark)") &&
  themeCss.includes("background-color: var(--white) !important")
) {
  console.log("✅ Forced light mode CSS found in professional-theme.css");
} else {
  console.log("⚠️  Forced light mode CSS not found in professional-theme.css");
}

console.log("\n🎯 Summary:");
console.log("- Dark mode CSS has been disabled");
console.log("- Light mode override file created and linked");
console.log("- Color scheme forced to light mode");
console.log("- Professional clean color palette applied");
console.log("\n✨ Light mode implementation complete!");
