#!/usr/bin/env node

import fs from "fs";
import path from "path";

// Read the index.html file
const indexPath = "frontend/public/index.html";
let content = fs.readFileSync(indexPath, "utf8");

// Define new outline icons for different features
const newIcons = [
  // Icon 1: Multi-tenant management (users)
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>`,

  // Icon 2: Communication/Network (message square)
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        <path d="M8 9h8"/>
        <path d="M8 13h6"/>
    </svg>`,

  // Icon 3: Organization/Structure (layers)
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <polygon points="12,2 2,7 12,12 22,7 12,2"/>
        <polyline points="2,17 12,22 22,17"/>
        <polyline points="2,12 12,17 22,12"/>
    </svg>`,

  // Icon 4: Role-based access (key)
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>`,

  // Icon 5: Access control (lock)
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <circle cx="12" cy="16" r="1"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>`,

  // Icon 6: User management (user check)
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="8.5" cy="7" r="4"/>
        <polyline points="17,11 19,13 23,9"/>
    </svg>`,

  // Icon 7: Alarm system (alert triangle)
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>`,

  // Icon 8: Monitoring (activity)
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
    </svg>`,

  // Icon 9: Integration (zap)
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
    </svg>`,
];

// Find all filled SVG icons and replace them with outline versions
const filledSvgPattern =
  /<svg viewBox="0 0 24 24" fill="currentColor"[^>]*>[\s\S]*?<\/svg>/g;

let iconIndex = 0;
content = content.replace(filledSvgPattern, (match) => {
  if (iconIndex < newIcons.length) {
    const newIcon = newIcons[iconIndex];
    iconIndex++;
    console.log(`🔄 Replaced icon ${iconIndex} with new outline icon`);
    return newIcon;
  }
  return match;
});

// Write the updated content back to the file
fs.writeFileSync(indexPath, content);

console.log(`✅ Updated ${iconIndex} feature icons with new outline designs`);
console.log("📍 All icons now use outline style without backgrounds");
console.log(
  "🎨 Icon themes: Users, Communication, Organization, Security, Access, Management, Alarms, Monitoring, Integration"
);
