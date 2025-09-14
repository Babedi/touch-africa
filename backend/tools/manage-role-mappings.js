#!/usr/bin/env node

import { program } from "commander";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(__dirname, "../config/role-mappings.json");

program
  .name("role-mappings")
  .description("CLI tool for managing role mappings")
  .version("1.0.0");

program
  .command("list")
  .description("List all role mappings")
  .action(() => {
    try {
      const mappings = JSON.parse(fs.readFileSync(configPath, "utf8"));
      console.log("\n📋 Current Role Mappings:");
      console.log("========================");
      Object.entries(mappings).forEach(([key, value]) => {
        console.log(`  ${key.padEnd(25)} -> ${value}`);
      });
      console.log("\nTotal mappings:", Object.keys(mappings).length);
    } catch (error) {
      console.error("❌ Error reading mappings:", error.message);
    }
  });

program
  .command("add <roleName> <roleCode>")
  .description("Add a new role mapping")
  .action((roleName, roleCode) => {
    try {
      const mappings = JSON.parse(fs.readFileSync(configPath, "utf8"));
      mappings[roleName] = roleCode;
      fs.writeFileSync(configPath, JSON.stringify(mappings, null, 2));
      console.log(`✅ Added mapping: ${roleName} -> ${roleCode}`);
    } catch (error) {
      console.error("❌ Error adding mapping:", error.message);
    }
  });

program
  .command("remove <roleName>")
  .description("Remove a role mapping")
  .action((roleName) => {
    try {
      const mappings = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (mappings[roleName]) {
        delete mappings[roleName];
        fs.writeFileSync(configPath, JSON.stringify(mappings, null, 2));
        console.log(`✅ Removed mapping: ${roleName}`);
      } else {
        console.log(`⚠️ Mapping not found: ${roleName}`);
      }
    } catch (error) {
      console.error("❌ Error removing mapping:", error.message);
    }
  });

program
  .command("reset")
  .description("Reset to default mappings")
  .action(() => {
    const defaults = {
      root: "INTERNAL_ROOT_ADMIN",
      internalRootAdmin: "INTERNAL_ROOT_ADMIN",
      internalSuperAdmin: "INTERNAL_SUPER_ADMIN",
      internalStandardAdmin: "INTERNAL_STANDARD_ADMIN",
      externalSuperAdmin: "EXTERNAL_SUPER_ADMIN",
      externalStandardAdmin: "EXTERNAL_STANDARD_ADMIN",
      lookupManager: "LOOKUP_MANAGER",
      tenantAdmin: "TENANT_ADMIN",
      tenantUser: "TENANT_USER",
    };

    fs.writeFileSync(configPath, JSON.stringify(defaults, null, 2));
    console.log("✅ Reset to default mappings");
  });

program.parse();
