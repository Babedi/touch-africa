#!/usr/bin/env node

/**
 * Script to standardize all API response formats across controller files
 *
 * This script will update all controller files to use the new standardized
 * response format with proper error handling.
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory for modules
const MODULES_DIR = path.join(__dirname, "..", "modules");

// Response patterns to replace
const RESPONSE_PATTERNS = [
  // Success responses with success: true
  {
    pattern:
      /res\.status\((\d+)\)\.json\(\{\s*success:\s*true,\s*data:\s*([^}]+),?\s*\}\)/g,
    replacement: 'sendSuccess(res, $2, "Operation completed successfully", $1)',
  },
  {
    pattern: /res\.json\(\{\s*success:\s*true,\s*data:\s*([^}]+),?\s*\}\)/g,
    replacement: 'sendSuccess(res, $1, "Operation completed successfully")',
  },

  // Success responses with message
  {
    pattern:
      /res\.status\((\d+)\)\.json\(\{\s*success:\s*true,\s*data:\s*([^,]+),\s*message:\s*"([^"]+)"\s*\}\)/g,
    replacement: 'sendSuccess(res, $2, "$3", $1)',
  },
  {
    pattern:
      /res\.json\(\{\s*success:\s*true,\s*data:\s*([^,]+),\s*message:\s*"([^"]+)"\s*\}\)/g,
    replacement: 'sendSuccess(res, $1, "$2")',
  },

  // Error responses with success: false
  {
    pattern:
      /res\.status\((\d+)\)\.json\(\{\s*success:\s*false,\s*error:\s*"([^"]+)"\s*\}\)/g,
    replacement: 'sendError(res, "OPERATION_FAILED", "$2", null, $1)',
  },
  {
    pattern: /res\.json\(\{\s*success:\s*false,\s*error:\s*"([^"]+)"\s*\}\)/g,
    replacement: 'sendError(res, "OPERATION_FAILED", "$1")',
  },

  // Not found errors
  {
    pattern:
      /res\.status\(404\)\.json\(\{\s*success:\s*false,\s*error:\s*"([^"]+)"\s*\}\)/g,
    replacement: 'sendNotFound(res, "$1")',
  },

  // Validation errors
  {
    pattern:
      /res\.status\(400\)\.json\(\{\s*success:\s*false,\s*error:\s*"Validation failed",\s*details:\s*([^}]+)\s*\}\)/g,
    replacement: 'sendValidationError(res, "Validation failed", $1)',
  },

  // Unauthorized errors
  {
    pattern:
      /res\.status\(401\)\.json\(\{\s*success:\s*false,\s*error:\s*"([^"]+)"\s*\}\)/g,
    replacement: 'sendUnauthorized(res, "$1")',
  },
];

// Import statement to add
const IMPORT_STATEMENT = `import {
  sendSuccess,
  sendList,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendConflict,
  handleZodError
} from "../../../utilities/response.util.js";`;

async function getAllControllerFiles(dir) {
  const files = [];

  async function traverse(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await traverse(fullPath);
      } else if (entry.name.endsWith(".controller.js")) {
        files.push(fullPath);
      }
    }
  }

  await traverse(dir);
  return files;
}

async function updateControllerFile(filePath) {
  console.log(`\n📝 Processing: ${path.relative(MODULES_DIR, filePath)}`);

  try {
    let content = await fs.readFile(filePath, "utf8");
    let modified = false;

    // Check if response utils are already imported
    if (!content.includes("response.util.js")) {
      // Find the last import statement
      const importRegex = /import\s+.*?from\s+['"'][^'"]+['"];?\s*\n/g;
      const imports = [...content.matchAll(importRegex)];

      if (imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const insertPosition = lastImport.index + lastImport[0].length;

        content =
          content.slice(0, insertPosition) +
          IMPORT_STATEMENT +
          "\n" +
          content.slice(insertPosition);
        modified = true;
        console.log("  ✓ Added response utility imports");
      }
    }

    // Apply response pattern replacements
    let patternChanges = 0;
    for (const { pattern, replacement } of RESPONSE_PATTERNS) {
      const originalContent = content;
      content = content.replace(pattern, replacement);
      if (content !== originalContent) {
        patternChanges++;
        modified = true;
      }
    }

    if (patternChanges > 0) {
      console.log(`  ✓ Updated ${patternChanges} response patterns`);
    }

    // Handle Zod error patterns
    const zodErrorPattern =
      /if \(error\.name === ["']ZodError["']\) \{\s*return res\.status\(400\)\.json\(\{[^}]+\}\);\s*\}/g;
    if (zodErrorPattern.test(content)) {
      content = content.replace(
        zodErrorPattern,
        'if (error.name === "ZodError") {\n      return handleZodError(res, error);\n    }'
      );
      modified = true;
      console.log("  ✓ Updated Zod error handling");
    }

    if (modified) {
      await fs.writeFile(filePath, content, "utf8");
      console.log("  ✅ File updated successfully");
      return true;
    } else {
      console.log("  ⚪ No changes needed");
      return false;
    }
  } catch (error) {
    console.error(`  ❌ Error processing file: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("🚀 Starting API response format standardization...\n");

  try {
    const controllerFiles = await getAllControllerFiles(MODULES_DIR);
    console.log(`Found ${controllerFiles.length} controller files\n`);

    let updatedCount = 0;

    for (const filePath of controllerFiles) {
      const wasUpdated = await updateControllerFile(filePath);
      if (wasUpdated) {
        updatedCount++;
      }
    }

    console.log(`\n🎉 Standardization complete!`);
    console.log(`📊 Files processed: ${controllerFiles.length}`);
    console.log(`📊 Files updated: ${updatedCount}`);
    console.log(`📊 Files unchanged: ${controllerFiles.length - updatedCount}`);
  } catch (error) {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as standardizeResponses };
