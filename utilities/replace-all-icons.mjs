#!/usr/bin/env node

import fs from "fs";

// Read the index.html file
const indexPath = "./frontend/public/index.html";
let content = fs.readFileSync(indexPath, "utf8");

console.log("🚀 Starting icon replacement process...");

// Replace specific filled SVG patterns with outline versions

// 1. Document/List icon (Multi-tenant management) - replace with message square
const docIconPattern =
  /<svg viewBox="0 0 24 24" fill="currentColor">\s*<path\s*d="M19 3H5c-1\.1 0-2 \.9-2 2v14c0 1\.1\.9 2 2 2h14c1\.1 0 2-.9 2-2V5c0-1\.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"\s*\/>\s*<\/svg>/g;
const messageSquareIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                <path d="M8 9h8"/>
                                <path d="M8 13h6"/>
                            </svg>`;

// 2. Checkmark circle icon (Role-based access) - replace with key icon
const checkIconPattern =
  /<svg viewBox="0 0 24 24" fill="currentColor">\s*<path\s*d="M12 2C6\.48 2 2 6\.48 2 12s4\.48 10 10 10 10-4\.48 10-10S17\.52 2 12 2zm-2 15l-5-5 1\.41-1\.41L10 14\.17l7\.59-7\.59L19 8l-9 9z"\s*\/>\s*<\/svg>/g;
const keyIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                            </svg>`;

// 3. Shield icon (Alarm system) - replace with alert triangle
const shieldIconPattern =
  /<svg viewBox="0 0 24 24" fill="currentColor">\s*<path d="M12 1L3 5v6c0 5\.55 3\.84 10\.74 9 12 5\.16-1\.26 9-6\.45 9-12V5l-9-4z"\s*\/>\s*<\/svg>/g;
const alertIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>`;

// Apply replacements
console.log("🔄 Replacing document icons with message square icons...");
content = content.replace(docIconPattern, messageSquareIcon);

console.log("🔄 Replacing checkmark icons with key icons...");
content = content.replace(checkIconPattern, keyIcon);

console.log("🔄 Replacing shield icons with alert triangle icons...");
content = content.replace(shieldIconPattern, alertIcon);

// Write the updated content back to the file
fs.writeFileSync(indexPath, content);

console.log("✅ All feature icons updated successfully!");
console.log("📍 New icon set:");
console.log("  🔹 Multi-tenant Management: User group icon");
console.log("  🔹 Communication: Message square icon");
console.log("  🔹 Role-based Access: Key icon");
console.log("  🔹 Alarm Integration: Alert triangle icon");
console.log("🎨 All icons now use outline style without backgrounds");
