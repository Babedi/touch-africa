/**
 * Role Mapping Configuration
 * Maps JWT role names to database role codes
 *
 * This configuration can be:
 * - Loaded from a JSON file
 * - Fetched from database
 * - Provided via environment variables
 * - Updated without code changes
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default role mappings (fallback)
// Strictly use Human-friendly labels (Title Case with spaces) as keys
const DEFAULT_ROLE_MAPPINGS = {
  // Root level access
  "Internal Root Admin": "INTERNAL_ROOT_ADMIN",

  // Admin levels
  "Internal Super Admin": "INTERNAL_SUPER_ADMIN",
  "Internal Standard Admin": "INTERNAL_STANDARD_ADMIN",
  "External Super Admin": "EXTERNAL_SUPER_ADMIN",
  "External Standard Admin": "EXTERNAL_STANDARD_ADMIN",

  // Specialized roles
  "Lookup Manager": "LOOKUP_MANAGER",
  "Tenant Admin": "TENANT_ADMIN",
  "Tenant User": "TENANT_USER",

  // Service roles
  "Service Admin": "SERVICE_ADMIN",
  "Service User": "SERVICE_USER",
};

/**
 * Load role mappings from JSON file if exists
 */
function loadFromFile() {
  try {
    const configPath = path.join(__dirname, "role-mappings.json");
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, "utf8");
      console.log("📄 Loaded role mappings from role-mappings.json");
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.warn("⚠️ Could not load role-mappings.json:", error.message);
  }
  return null;
}

/**
 * Load role mappings from environment variable
 */
function loadFromEnv() {
  try {
    if (process.env.ROLE_MAPPINGS) {
      console.log("🌍 Loaded role mappings from environment variable");
      return JSON.parse(process.env.ROLE_MAPPINGS);
    }
  } catch (error) {
    console.warn(
      "⚠️ Could not parse ROLE_MAPPINGS env variable:",
      error.message
    );
  }
  return null;
}

/**
 * Load role mappings from database (async)
 */
async function loadFromDatabase() {
  try {
    // Only attempt if we're in a database-connected context
    if (global.dbConnection && global.dbConnection.isConnected) {
      const { default: InternalRole } = await import(
        "../modules/internal/internal.role/internal.role.model.js"
      );

      const roles = await InternalRole.find({}, "roleCode roleAlias").lean();

      if (roles && roles.length > 0) {
        const mappings = {};
        roles.forEach((role) => {
          // Map roleCode to itself
          mappings[role.roleCode.toLowerCase()] = role.roleCode;

          // Map any aliases
          if (role.roleAlias) {
            role.roleAlias.forEach((alias) => {
              mappings[alias.toLowerCase()] = role.roleCode;
            });
          }
        });

        console.log("💾 Loaded role mappings from database");
        return mappings;
      }
    }
  } catch (error) {
    console.warn(
      "⚠️ Could not load role mappings from database:",
      error.message
    );
  }
  return null;
}

/**
 * Role mapping configuration class
 */
class RoleMappingConfig {
  constructor() {
    this.mappings = DEFAULT_ROLE_MAPPINGS;
    this.source = "default";
    this.lastUpdated = new Date();
  }

  /**
   * Initialize role mappings (call on app startup)
   */
  async initialize() {
    console.log("🔧 Initializing role mapping configuration...");

    // Priority order: Environment > File > Database > Default

    // Try environment variable first (highest priority)
    const envMappings = loadFromEnv();
    if (envMappings) {
      this.mappings = { ...DEFAULT_ROLE_MAPPINGS, ...envMappings };
      this.source = "environment";
      return;
    }

    // Try file next
    const fileMappings = loadFromFile();
    if (fileMappings) {
      this.mappings = { ...DEFAULT_ROLE_MAPPINGS, ...fileMappings };
      this.source = "file";
      return;
    }

    // Try database
    const dbMappings = await loadFromDatabase();
    if (dbMappings) {
      this.mappings = { ...DEFAULT_ROLE_MAPPINGS, ...dbMappings };
      this.source = "database";
      return;
    }

    // Use defaults
    console.log("📋 Using default role mappings");
  }

  /**
   * Get role mapping
   */
  getMapping(roleName) {
    if (!roleName) return null;

    // Strict mode: only accept exact Human-friendly labels as keys
    return this.mappings[roleName] || null;
  }

  /**
   * Get all mappings
   */
  getAllMappings() {
    return { ...this.mappings };
  }

  /**
   * Add or update a mapping
   */
  addMapping(roleName, roleCode) {
    this.mappings[roleName] = roleCode;
    this.lastUpdated = new Date();
  }

  /**
   * Remove a mapping
   */
  removeMapping(roleName) {
    delete this.mappings[roleName];
    this.lastUpdated = new Date();
  }

  /**
   * Reload mappings from source
   */
  async reload() {
    console.log("🔄 Reloading role mappings...");
    await this.initialize();
  }

  /**
   * Save current mappings to file
   */
  async saveToFile() {
    try {
      const configPath = path.join(__dirname, "role-mappings.json");
      fs.writeFileSync(configPath, JSON.stringify(this.mappings, null, 2));
      console.log("💾 Saved role mappings to role-mappings.json");
      return true;
    } catch (error) {
      console.error("❌ Failed to save role mappings:", error);
      return false;
    }
  }

  /**
   * Get configuration status
   */
  getStatus() {
    return {
      source: this.source,
      lastUpdated: this.lastUpdated,
      mappingCount: Object.keys(this.mappings).length,
    };
  }
}

// Create singleton instance
const roleMappingConfig = new RoleMappingConfig();

export default roleMappingConfig;
export { DEFAULT_ROLE_MAPPINGS };
