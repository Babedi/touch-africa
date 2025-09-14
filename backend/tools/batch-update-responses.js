#!/usr/bin/env node

/**
 * Batch Response Format Updater
 * Updates remaining controller files to use standardized response formats
 */

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Controllers to update (remaining ones)
const CONTROLLERS_TO_UPDATE = [
  "modules/internal/cultivar.template/cultivar.template.controller.js",
  "modules/internal/lookup/lookup.controller.js",
  "modules/internal/lookup.sub.category/lookup.sub.category.controller.js",
  "modules/internal/permission/permission.controller.js",
  "modules/internal/permission/internal.permission/internal.permission.controller.js",
  "modules/internal/role.mapping/role.mapping.controller.js",
  "modules/internal/service.request/service.request.controller.js",
  "modules/external/tenant.admin/tenant.admin.controller.js",
  "modules/external/tenant.user/tenant.user.controller.js",
  "modules/general/service.info/service.info.controller.js",
];

// Response import statement
const RESPONSE_IMPORTS = `import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendConflict,
  handleZodError
} from "../../../utilities/response.util.js";`;

// Pattern replacements for common response formats
const RESPONSE_REPLACEMENTS = [
  // Success responses
  {
    pattern:
      /res\.status\(201\)\.json\(\{\s*success:\s*true,\s*data:\s*([^,}]+)(?:,\s*message:\s*"([^"]+)")?\s*\}\)/g,
    replacement: (match, data, message) =>
      `sendSuccess(res, ${data}, ${
        message ? `"${message}"` : '"Operation completed successfully"'
      }, 201)`,
  },
  {
    pattern:
      /res\.status\(200\)\.json\(\{\s*success:\s*true,\s*data:\s*([^,}]+)(?:,\s*message:\s*"([^"]+)")?\s*\}\)/g,
    replacement: (match, data, message) =>
      `sendSuccess(res, ${data}, ${
        message ? `"${message}"` : '"Operation completed successfully"'
      })`,
  },
  {
    pattern:
      /res\.json\(\{\s*success:\s*true,\s*data:\s*([^,}]+)(?:,\s*message:\s*"([^"]+)")?\s*\}\)/g,
    replacement: (match, data, message) =>
      `sendSuccess(res, ${data}, ${
        message ? `"${message}"` : '"Operation completed successfully"'
      })`,
  },

  // Error responses
  {
    pattern:
      /res\.status\(400\)\.json\(\{\s*success:\s*false,\s*error:\s*"([^"]+)"\s*\}\)/g,
    replacement: (match, error) => `sendValidationError(res, "${error}")`,
  },
  {
    pattern:
      /res\.status\(404\)\.json\(\{\s*success:\s*false,\s*error:\s*"([^"]+)"\s*\}\)/g,
    replacement: (match, error) => `sendNotFound(res, "${error}")`,
  },
  {
    pattern:
      /res\.status\(401\)\.json\(\{\s*success:\s*false,\s*error:\s*"([^"]+)"\s*\}\)/g,
    replacement: (match, error) => `sendUnauthorized(res, "${error}")`,
  },
  {
    pattern:
      /res\.status\(409\)\.json\(\{\s*success:\s*false,\s*error:\s*"([^"]+)"\s*\}\)/g,
    replacement: (match, error) => `sendConflict(res, "${error}")`,
  },
  {
    pattern:
      /res\.status\(500\)\.json\(\{\s*success:\s*false,\s*error:\s*"([^"]+)"\s*\}\)/g,
    replacement: (match, error) =>
      `sendError(res, "OPERATION_FAILED", "${error}", null, 500)`,
  },

  // Validation error patterns
  {
    pattern:
      /res\.status\(400\)\.json\(\{\s*error:\s*"ValidationError",\s*details:\s*([^}]+)\s*\}\)/g,
    replacement: (match, details) =>
      `sendValidationError(res, "Validation failed", ${details})`,
  },
];

async function updateControllerFile(filePath) {
  const fullPath = path.join(__dirname, "..", filePath);

  try {
    let content = await fs.readFile(fullPath, "utf8");
    let modified = false;

    console.log(`📝 Processing: ${filePath}`);

    // Add imports if not present
    if (!content.includes("response.util.js")) {
      // Find the last import statement
      const importRegex = /import\s+.*?from\s+['"'][^'"]+['"];?\s*\n/g;
      const imports = [...content.matchAll(importRegex)];

      if (imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const insertPosition = lastImport.index + lastImport[0].length;

        content =
          content.slice(0, insertPosition) +
          RESPONSE_IMPORTS +
          "\n" +
          content.slice(insertPosition);
        modified = true;
        console.log("  ✓ Added response utility imports");
      }
    }

    // Apply response pattern replacements
    let patternChanges = 0;
    for (const { pattern, replacement } of RESPONSE_REPLACEMENTS) {
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
      /if \(.*error.*instanceof z\.ZodError.*\) \{\s*return res\.status\(400\)\.json\(\{[^}]+\}\);\s*\}/g;
    if (zodErrorPattern.test(content)) {
      content = content.replace(
        zodErrorPattern,
        "if (error instanceof z.ZodError) {\n      return handleZodError(res, error);\n    }"
      );
      modified = true;
      console.log("  ✓ Updated Zod error handling");
    }

    if (modified) {
      await fs.writeFile(fullPath, content, "utf8");
      console.log("  ✅ File updated successfully");
      return true;
    } else {
      console.log("  ⚪ No changes needed");
      return false;
    }
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("🚀 Starting batch response format updates...\n");

  let updatedCount = 0;
  let processedCount = 0;

  for (const controllerPath of CONTROLLERS_TO_UPDATE) {
    try {
      const wasUpdated = await updateControllerFile(controllerPath);
      if (wasUpdated) {
        updatedCount++;
      }
      processedCount++;
    } catch (error) {
      console.error(`Failed to process ${controllerPath}: ${error.message}`);
    }
    console.log(""); // Add space between files
  }

  console.log(`🎉 Batch update complete!`);
  console.log(`📊 Files processed: ${processedCount}`);
  console.log(`📊 Files updated: ${updatedCount}`);
  console.log(`📊 Files unchanged: ${processedCount - updatedCount}`);
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as batchUpdateResponses };
