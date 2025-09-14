const fs = require("fs");
const path = require("path");

// List of remaining controllers that need updates
const CONTROLLERS = [
  "modules/internal/lookup/lookup.controller.js",
  "modules/internal/lookup.sub.category/lookup.sub.category.controller.js",
  "modules/internal/role.mapping/role.mapping.controller.js",
  "modules/internal/service.request/service.request.controller.js",
  "modules/internal/permission/internal.permission/internal.permission.controller.js",
  "modules/external/tenant.user/tenant.user.controller.js",
];

// Response patterns to update
const patterns = [
  // Success responses
  {
    search:
      /res\.status\(201\)\.json\(\{\s*success:\s*true,\s*data:\s*([^,}]+),?\s*\}\)/g,
    replace: 'sendSuccess(res, $1, "Operation completed successfully", 201)',
  },
  {
    search:
      /res\.status\(200\)\.json\(\{\s*success:\s*true,\s*data:\s*([^,}]+),?\s*\}\)/g,
    replace: 'sendSuccess(res, $1, "Operation completed successfully")',
  },
  {
    search: /res\.json\(\{\s*success:\s*true,\s*data:\s*([^,}]+),?\s*\}\)/g,
    replace: 'sendSuccess(res, $1, "Operation completed successfully")',
  },

  // Error responses
  {
    search:
      /res\.status\(400\)\.json\(\{\s*success:\s*false,\s*error:\s*"([^"]+)",?\s*\}\)/g,
    replace: 'sendValidationError(res, "$1")',
  },
  {
    search:
      /res\.status\(404\)\.json\(\{\s*success:\s*false,\s*error:\s*"([^"]+)",?\s*\}\)/g,
    replace: 'sendNotFound(res, "$1")',
  },
  {
    search:
      /res\.status\(401\)\.json\(\{\s*success:\s*false,\s*error:\s*"([^"]+)",?\s*\}\)/g,
    replace: 'sendUnauthorized(res, "$1")',
  },
  {
    search:
      /res\.status\(409\)\.json\(\{\s*success:\s*false,\s*error:\s*"([^"]+)",?\s*\}\)/g,
    replace: 'sendConflict(res, "$1")',
  },

  // Zod error handling
  {
    search:
      /if \(error\.name === ["']ZodError["']\) \{\s*return res\.status\(400\)\.json\(\{\s*success:\s*false,\s*error:\s*"Validation failed",\s*details:\s*error\.errors,?\s*\}\);\s*\}/g,
    replace:
      'if (error.name === "ZodError") {\n      return handleZodError(res, error);\n    }',
  },
];

const imports = `import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendConflict,
  handleZodError
} from "../../../utilities/response.util.js";`;

function updateController(filePath) {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return false;
  }

  try {
    let content = fs.readFileSync(fullPath, "utf8");
    let modified = false;

    console.log(`📝 Processing: ${filePath}`);

    // Add imports if not present
    if (!content.includes("response.util.js")) {
      const importRegex = /import\s+.*?from\s+['"'][^'"]+['"];?\s*\n/g;
      const importMatches = [...content.matchAll(importRegex)];

      if (importMatches.length > 0) {
        const lastImport = importMatches[importMatches.length - 1];
        const insertPosition = lastImport.index + lastImport[0].length;

        content =
          content.slice(0, insertPosition) +
          imports +
          "\n" +
          content.slice(insertPosition);
        modified = true;
        console.log("  ✓ Added response utility imports");
      }
    }

    // Apply patterns
    let changes = 0;
    patterns.forEach((pattern) => {
      const before = content;
      content = content.replace(pattern.search, pattern.replace);
      if (content !== before) {
        changes++;
        modified = true;
      }
    });

    if (changes > 0) {
      console.log(`  ✓ Applied ${changes} response pattern updates`);
    }

    if (modified) {
      fs.writeFileSync(fullPath, content, "utf8");
      console.log("  ✅ File updated successfully");
      return true;
    } else {
      console.log("  ⚪ No changes needed");
      return false;
    }
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return false;
  }
}

// Process all controllers
console.log("🚀 Starting batch controller updates...\n");

let updated = 0;
CONTROLLERS.forEach((controller) => {
  if (updateController(controller)) {
    updated++;
  }
  console.log("");
});

console.log(
  `🎉 Update complete! Updated ${updated}/${CONTROLLERS.length} controllers.`
);
