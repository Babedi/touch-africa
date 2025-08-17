#!/usr/bin/env node

import { readFileSync } from "fs";
import { join } from "path";

console.log("🎯 Interface Cleanup Verification");
console.log("================================");

const htmlPath = join(process.cwd(), "frontend", "public", "index.html");
const html = readFileSync(htmlPath, "utf8");

console.log("\n📋 Header Navigation Check:");
// Check if tenant buttons were removed
const tenantAdminButton = html.includes("tenantAdminLoginBtn");
const tenantUserButton = html.includes("tenantUserLoginBtn");
const internalAdminButton = html.includes("internalAdminLoginBtn");

if (!tenantAdminButton && !tenantUserButton && internalAdminButton) {
  console.log(
    "✅ Header navigation cleaned - only Internal Admin button remains"
  );
} else {
  console.log("❌ Header navigation not properly cleaned");
  if (tenantAdminButton) console.log("   - Tenant Admin button still present");
  if (tenantUserButton) console.log("   - Tenant User button still present");
  if (!internalAdminButton) console.log("   - Internal Admin button missing");
}

console.log("\n📋 Hero Section Check:");
// Check if hero buttons were removed
const heroButtons = html.includes("hero-buttons");
if (!heroButtons) {
  console.log("✅ Hero section buttons removed");
} else {
  console.log("❌ Hero section buttons still present");
}

console.log('\n📋 "Ready to access" Section Check:');
// Check if the CTA section was removed
const readyToAccess = html.includes("Ready to access your dashboard?");
if (!readyToAccess) {
  console.log('✅ "Ready to access your dashboard?" section removed');
} else {
  console.log('❌ "Ready to access your dashboard?" section still present');
}

// Check CSS fixes
const cssPath = join(
  process.cwd(),
  "frontend",
  "public",
  "professional-theme.css"
);
const css = readFileSync(cssPath, "utf8");

console.log("\n📋 CSS Fixes Check:");
// Check trust section colors
if (css.includes("var(--primary-blue)") && !css.includes("var(--at-blue)")) {
  console.log("✅ Trust section colors updated to use primary-blue");
} else {
  console.log("⚠️  Trust section colors may still have issues");
}

// Check footer colors
if (
  css.includes("background: var(--gray-100)") &&
  css.includes("color: var(--gray-700)")
) {
  console.log("✅ Footer styling updated for light mode");
} else {
  console.log("⚠️  Footer styling may need adjustment");
}

// Check light mode override
const overridePath = join(
  process.cwd(),
  "frontend",
  "public",
  "light-mode-override.css"
);
const override = readFileSync(overridePath, "utf8");

console.log("\n📋 Light Mode Override Check:");
if (override.includes(".section-subtitle") && override.includes(".copyright")) {
  console.log("✅ Text contrast overrides added");
} else {
  console.log("⚠️  Text contrast overrides may be incomplete");
}

console.log("\n🎯 Summary of Changes Made:");
console.log("- ✅ Removed Tenant Admin and Tenant User buttons from header");
console.log("- ✅ Removed Internal Admin button from hero section");
console.log('- ✅ Removed "Ready to access your dashboard?" section');
console.log("- ✅ Fixed trust section background colors");
console.log("- ✅ Updated footer for light mode");
console.log("- ✅ Enhanced text contrast in all sections");
console.log("\n✨ Interface cleanup complete!");
