import fs from "fs/promises";
import path from "path";

/**
 * Analyze all controller routes to identify missing CRUD endpoints
 * Ensure all endpoints follow REST conventions:
 * - GET /resources          # Get all resources
 * - POST /resources         # Create a new resource
 * - GET /resources/:id      # Get a specific resource
 * - PUT /resources/:id      # Replace a specific resource
 * - PATCH /resources/:id    # Partially update a resource
 * - DELETE /resources/:id   # Delete a resource
 */

const REQUIRED_ENDPOINTS = [
  "GET_ALL",
  "POST",
  "GET_BY_ID",
  "PUT",
  "PATCH",
  "DELETE",
];

const modules = [
  // Internal modules
  {
    path: "modules/internal/admin",
    resource: "admins",
    base: "/internal/admins",
  },
  {
    path: "modules/internal/tenant",
    resource: "tenants",
    base: "/external/tenants",
  },
  {
    path: "modules/internal/person",
    resource: "persons",
    base: "/internal/persons",
  },
  { path: "modules/internal/role", resource: "roles", base: "/internal/roles" },
  {
    path: "modules/internal/lookup",
    resource: "lookups",
    base: "/internal/lookups",
  },
  {
    path: "modules/internal/lookup.category",
    resource: "lookup-categories",
    base: "/internal/lookup-categories",
  },
  {
    path: "modules/internal/lookup.sub.category",
    resource: "lookup-sub-categories",
    base: "/internal/lookup-sub-categories",
  },
  {
    path: "modules/internal/permission",
    resource: "permissions",
    base: "/internal/permissions",
  },
  {
    path: "modules/internal/role.mapping",
    resource: "role-mappings",
    base: "/internal/role-mappings",
  },
  {
    path: "modules/internal/service.request",
    resource: "service-requests",
    base: "/internal/service-requests",
  },
  {
    path: "modules/internal/cultivar.template",
    resource: "cultivar-templates",
    base: "/internal/cultivar-templates",
  },

  // External modules
  {
    path: "modules/external/tenant.admin",
    resource: "tenant-admins",
    base: "/external/tenant-admins",
  },
  {
    path: "modules/external/tenant.user",
    resource: "tenant-users",
    base: "/external/tenant-users",
  },

  // General modules
  {
    path: "modules/general/service.info",
    resource: "service-info",
    base: "/general/service-info",
  },
];

async function analyzeRoutes() {
  const analysis = [];

  for (const module of modules) {
    const routeFile = path.join(
      module.path,
      `${path.basename(module.path)}.route.js`
    );

    try {
      const content = await fs.readFile(routeFile, "utf-8");

      const endpoints = {
        GET_ALL: false,
        POST: false,
        GET_BY_ID: false,
        PUT: false,
        PATCH: false,
        DELETE: false,
      };

      // Parse route definitions
      if (content.includes(`router.get("${module.base}"`))
        endpoints.GET_ALL = true;
      if (content.includes(`router.post("${module.base}"`))
        endpoints.POST = true;
      if (content.includes(`router.get("${module.base}/:id"`))
        endpoints.GET_BY_ID = true;
      if (content.includes(`router.put("${module.base}/:id"`))
        endpoints.PUT = true;
      if (content.includes(`router.patch("${module.base}/:id"`))
        endpoints.PATCH = true;
      if (content.includes(`router.delete("${module.base}/:id"`))
        endpoints.DELETE = true;

      const missing = REQUIRED_ENDPOINTS.filter((ep) => !endpoints[ep]);

      analysis.push({
        module: module.path,
        resource: module.resource,
        base: module.base,
        endpoints,
        missing,
        isComplete: missing.length === 0,
      });
    } catch (error) {
      analysis.push({
        module: module.path,
        resource: module.resource,
        base: module.base,
        error: `File not found or error reading: ${error.message}`,
        missing: REQUIRED_ENDPOINTS,
        isComplete: false,
      });
    }
  }

  return analysis;
}

async function generateReport() {
  const analysis = await analyzeRoutes();

  console.log("# REST API Endpoint Analysis Report\n");
  console.log("## Summary\n");

  const complete = analysis.filter((a) => a.isComplete);
  const incomplete = analysis.filter((a) => !a.isComplete);

  console.log(`- **Complete modules**: ${complete.length}/${analysis.length}`);
  console.log(
    `- **Incomplete modules**: ${incomplete.length}/${analysis.length}`
  );
  console.log(
    `- **Overall progress**: ${Math.round(
      (complete.length / analysis.length) * 100
    )}%\n`
  );

  console.log("## Detailed Analysis\n");

  for (const item of analysis) {
    console.log(`### ${item.resource} (${item.module})`);
    console.log(`**Base URL**: \`${item.base}\``);

    if (item.error) {
      console.log(`**Status**: ❌ Error - ${item.error}\n`);
      continue;
    }

    console.log(
      `**Status**: ${item.isComplete ? "✅ Complete" : "⚠️ Missing endpoints"}`
    );

    if (!item.isComplete) {
      console.log(`**Missing**: ${item.missing.join(", ")}`);
    }

    console.log("**Current endpoints**:");
    Object.entries(item.endpoints).forEach(([endpoint, exists]) => {
      const method =
        endpoint === "GET_ALL"
          ? "GET"
          : endpoint === "GET_BY_ID"
          ? "GET"
          : endpoint;
      const path =
        endpoint === "GET_ALL"
          ? item.base
          : endpoint === "POST"
          ? item.base
          : `${item.base}/:id`;
      console.log(`- ${exists ? "✅" : "❌"} ${method} ${path}`);
    });

    console.log("");
  }

  console.log("## Required Actions\n");

  for (const item of incomplete) {
    if (item.error) continue;

    console.log(`### ${item.resource}`);
    console.log("Missing endpoints to implement:");

    item.missing.forEach((endpoint) => {
      const method =
        endpoint === "GET_ALL"
          ? "GET"
          : endpoint === "GET_BY_ID"
          ? "GET"
          : endpoint;
      const path =
        endpoint === "GET_ALL"
          ? item.base
          : endpoint === "POST"
          ? item.base
          : `${item.base}/:id`;
      console.log(
        `- **${method} ${path}** - ${getEndpointDescription(endpoint)}`
      );
    });

    console.log("");
  }
}

function getEndpointDescription(endpoint) {
  const descriptions = {
    GET_ALL: "Get all resources with optional filtering and pagination",
    POST: "Create a new resource",
    GET_BY_ID: "Get a specific resource by ID",
    PUT: "Replace/update a specific resource completely",
    PATCH: "Partially update a specific resource",
    DELETE: "Delete a specific resource",
  };

  return descriptions[endpoint] || "Unknown endpoint";
}

// Run the analysis
generateReport().catch(console.error);
