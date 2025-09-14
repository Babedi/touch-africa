#!/usr/bin/env node

/**
 * TouchAfrica Backend - Query Strategy Status & Validator
 *
 * This script scans modules and reports whether standardized query endpoints
 * (search, bulk, export, stats) are implemented, and whether controller,
 * service, and route files exist. It does not modify any files.
 *
 * Run:
 *   node backend/scripts/implement-query-strategy.js
 */

import fs from "fs";
import path from "path";

const MODULES_BASE_PATH =
  "c:/Users/Development/Desktop/New TouchAfrica/backend/modules";

// The 14 modules targeted by the standardized query strategy
const MODULES = [
  // Internal
  { path: "internal/admin", name: "Admin" },
  { path: "internal/tenant", name: "Tenant" },
  { path: "internal/person", name: "Person" },
  { path: "internal/role", name: "Role" },
  { path: "internal/lookup", name: "Lookup" },
  { path: "internal/permission", name: "Permission" },
  { path: "internal/cultivar.template", name: "CultivarTemplate" },
  { path: "internal/service.request", name: "ServiceRequest" },
  { path: "internal/lookup.category", name: "LookupCategory" },
  { path: "internal/lookup.sub.category", name: "LookupSubCategory" },
  { path: "internal/role.mapping", name: "RoleMapping" },
  // External
  { path: "external/tenant.admin", name: "TenantAdmin" },
  { path: "external/tenant.user", name: "TenantUser" },
  // General
  { path: "general/service.info", name: "ServiceInfo" },
];

function fileExists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function readText(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

// Derive filenames from module leaf folder (e.g., lookup.sub.category => lookup.sub.category.*.js)
function stemsFor(modPath) {
  const leaf = modPath.split("/").pop();
  return {
    controller: `${leaf}.controller.js`,
    service: `${leaf}.service.js`,
    route: `${leaf}.route.js`,
  };
}

function validateModules() {
  const status = { completed: [], inProgress: [], pending: [] };

  console.log("🚀 Query Strategy Status - TouchAfrica");
  console.log("📊 Validating modules...\n");

  for (const mod of MODULES) {
    const baseDir = path.join(MODULES_BASE_PATH, mod.path);
    const stems = stemsFor(mod.path);

    const controllerPath = path.join(baseDir, stems.controller);
    const servicePath = path.join(baseDir, stems.service);
    const routePath = path.join(baseDir, stems.route);

    const hasController = fileExists(controllerPath);
    const hasService = fileExists(servicePath);
    const hasRoute = fileExists(routePath);

    const routeContent = hasRoute ? readText(routePath) : "";
    const hasSearch = /\/search\b/.test(routeContent);
    const hasBulk = /\/bulk\b/.test(routeContent);
    const hasExport = /\/export\b/.test(routeContent);
    const hasStats = /\/stats\b/.test(routeContent);

    const filesSummary = [
      hasController ? "controller✓" : "controller×",
      hasService ? "service✓" : "service×",
      hasRoute ? "route✓" : "route×",
    ].join("  ");

    const endpointsSummary = [
      hasSearch ? "search✓" : "search×",
      hasBulk ? "bulk✓" : "bulk×",
      hasExport ? "export✓" : "export×",
      hasStats ? "stats✓" : "stats×",
    ].join("  ");

    let state;
    if (
      hasController &&
      hasService &&
      hasRoute &&
      hasSearch &&
      hasBulk &&
      hasExport &&
      hasStats
    ) {
      state = "completed";
      status.completed.push(mod.name);
    } else if (hasController || hasService || hasRoute) {
      state = "in-progress";
      status.inProgress.push(mod.name);
    } else {
      state = "pending";
      status.pending.push(mod.name);
    }

    console.log(`🔹 ${mod.name} [${state}]`);
    console.log(`   📁 ${mod.path}`);
    console.log(`   🔧 ${filesSummary}`);
    console.log(`   🌐 ${endpointsSummary}\n`);
  }

  console.log("========================");
  console.log("📋 IMPLEMENTATION SUMMARY");
  console.log(`✅ Completed: ${status.completed.length}`);
  console.log(`🔄 In Progress: ${status.inProgress.length}`);
  console.log(`⏳ Pending: ${status.pending.length}`);

  if (status.completed.length) {
    console.log(`\n✅ Completed Modules: ${status.completed.join(", ")}`);
  }
  if (status.inProgress.length) {
    console.log(`\n🔄 In-Progress Modules: ${status.inProgress.join(", ")}`);
  }
  if (status.pending.length) {
    console.log(`\n⏳ Pending Modules: ${status.pending.join(", ")}`);
  }

  console.log(
    "\n💡 Tip: Follow the list/search/bulk/export/stats pattern to complete any pending modules."
  );

  return status;
}

// Execute when run directly
if (
  process.argv[1] &&
  process.argv[1].includes("implement-query-strategy.js")
) {
  try {
    validateModules();
  } catch (err) {
    console.error("❌ Validator failed:", err.message);
    process.exitCode = 1;
  }
}

export default {
  MODULES,
  validateModules,
};
