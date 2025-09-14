import dotenv from "dotenv";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

/**
 * Environment Configuration Validator
 * Ensures all required environment variables and files are present
 */

// Helper validators
const isValidUrl = (value) => {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

const isSizeString = (value) =>
  /^(\d+)(b|kb|mb|gb)$/i.test(String(value || "").trim());

const isStrongPassword = (value) =>
  typeof value === "string" &&
  value.length >= 8 &&
  /[A-Z]/.test(value) &&
  /[a-z]/.test(value) &&
  /\d/.test(value) &&
  /[^A-Za-z0-9]/.test(value);

// Required environment variables with validation rules
const envConfig = {
  // Server Configuration
  PORT: {
    required: true,
    type: "number",
    default: 5000,
    validate: (value) => {
      const port = parseInt(value);
      return port > 0 && port < 65536;
    },
    error: "PORT must be a valid port number (1-65535)",
  },

  NODE_ENV: {
    required: true,
    type: "string",
    default: "development",
    validate: (value) => ["development", "production", "test"].includes(value),
    error: "NODE_ENV must be one of: development, production, test",
  },

  // Client/Frontend origin (used by CORS and connect-src)
  CLIENT_ORIGIN: {
    required: false,
    type: "string",
    validate: (value) => !value || isValidUrl(value),
    error: "CLIENT_ORIGIN must be a valid http(s) URL",
  },

  // JWT Configuration
  JWT_SECRET: {
    required: true,
    type: "string",
    validate: (value) => value && value.length >= 32,
    error: "JWT_SECRET must be at least 32 characters long",
  },

  JWT_EXPIRES_IN: {
    required: false,
    type: "string",
    default: "1h",
    validate: (value) => /^(\d+[smhd]?)$/.test(value),
    error: "JWT_EXPIRES_IN must be in format like 1h, 30m, 7d",
  },

  JWT_REFRESH_SECRET: {
    required: false,
    type: "string",
    validate: (value) => !value || value.length >= 32,
    error: "JWT_REFRESH_SECRET must be at least 32 characters long if provided",
  },

  JWT_REFRESH_EXPIRES_IN: {
    required: false,
    type: "string",
    default: "7d",
    validate: (value) => /^(\d+[smhd]?)$/.test(value),
    error: "JWT_REFRESH_EXPIRES_IN must be in format like 1h, 30m, 7d",
  },

  // Firebase Configuration
  FIREBASE_PROJECT_ID: {
    required: true,
    type: "string",
    validate: (value) => value && value.length > 0,
    error: "FIREBASE_PROJECT_ID is required",
  },

  FIREBASE_CLIENT_EMAIL: {
    required: true,
    type: "string",
    validate: (value) => value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    error: "FIREBASE_CLIENT_EMAIL must be a valid email address",
  },

  FIREBASE_PRIVATE_KEY: {
    required: true,
    type: "string",
    validate: (value) => value && value.includes("-----BEGIN PRIVATE KEY-----"),
    error: "FIREBASE_PRIVATE_KEY must be a valid private key",
  },

  // Security Configuration
  TRUST_PROXY: {
    required: false,
    type: "boolean",
    default: "false",
    validate: (value) => ["true", "false"].includes(value),
    error: "TRUST_PROXY must be true or false",
  },

  // CORS Configuration
  CORS_ORIGIN: {
    required: false,
    type: "string",
    default: "*",
    validate: (value) => !value || value === "*" || /^https?:\/\//.test(value),
    error: "CORS_ORIGIN must be * or a valid URL",
  },

  // Logging Configuration
  LOG_LEVEL: {
    required: false,
    type: "string",
    default: "info",
    validate: (value) =>
      ["error", "warn", "info", "http", "debug"].includes(value),
    error: "LOG_LEVEL must be one of: error, warn, info, http, debug",
  },

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: {
    required: false,
    type: "number",
    default: 900000, // 15 minutes
    validate: (value) => parseInt(value) > 0,
    error: "RATE_LIMIT_WINDOW_MS must be a positive number",
  },

  RATE_LIMIT_MAX: {
    required: false,
    type: "number",
    default: 100,
    validate: (value) => parseInt(value) > 0,
    error: "RATE_LIMIT_MAX must be a positive number",
  },

  // Root admin bootstrap (optional but recommended outside tests)
  ROOT_ADMIN_EMAIL: {
    required: false,
    type: "string",
    validate: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    error: "ROOT_ADMIN_EMAIL must be a valid email address",
  },

  ROOT_ADMIN_PASSWORD: {
    required: false,
    type: "string",
    validate: (value) => !value || isStrongPassword(value),
    error:
      "ROOT_ADMIN_PASSWORD should be at least 8 chars and include upper, lower, number, and symbol",
  },

  // Body size limits
  FORM_LIMIT: {
    required: false,
    type: "string",
    default: "50kb",
    validate: (value) => isSizeString(value),
    error: "FORM_LIMIT must be a size string like 50kb, 1mb",
  },

  JSON_LIMIT: {
    required: false,
    type: "string",
    default: "100kb",
    validate: (value) => isSizeString(value),
    error: "JSON_LIMIT must be a size string like 100kb, 1mb",
  },

  // HTTPS (optional)
  HTTPS_ENABLED: {
    required: false,
    type: "boolean",
    default: "false",
    validate: (value) => ["true", "false", true, false].includes(value),
    error: "HTTPS_ENABLED must be true or false",
  },

  SSL_CERT_PATH: {
    required: false,
    type: "string",
    validate: (value) => !value || typeof value === "string",
    error: "SSL_CERT_PATH must be a string path",
  },

  SSL_KEY_PATH: {
    required: false,
    type: "string",
    validate: (value) => !value || typeof value === "string",
    error: "SSL_KEY_PATH must be a string path",
  },
};

// Required files with validation
const requiredFiles = [
  {
    path: path.resolve(__dirname, "..", "secrets", "serviceAccountKey.json"),
    description: "Firebase service account key",
    validate: (content) => {
      try {
        const json = JSON.parse(content);
        return (
          json.type === "service_account" &&
          json.project_id &&
          json.private_key &&
          json.client_email
        );
      } catch {
        return false;
      }
    },
    error: "Service account key must be valid Firebase service account JSON",
  },
  {
    path: path.resolve(__dirname, "..", "..", ".env"),
    description: "Environment variables file",
    validate: (content) => content.length > 0,
    error: ".env file exists but is empty",
    optional: true, // Make .env file validation optional since we only validate present vars
  },
];

/**
 * Validate environment configuration
 */
function validateEnvironment() {
  console.log("🔍 Validating environment configuration...\n");

  const errors = [];
  const warnings = [];
  const applied = [];

  // Only validate environment variables that are actually present in .env
  // Get all environment variables that have values
  const presentEnvVars = Object.keys(process.env).filter(
    (key) => process.env[key] !== undefined && process.env[key] !== ""
  );

  // Validate only the environment variables that are present and have config
  for (const key of presentEnvVars) {
    const config = envConfig[key];
    if (!config) continue; // Skip variables not in our config

    const value = process.env[key];

    // Type conversion
    let processedValue = value;
    if (config.type === "number") {
      processedValue = parseInt(value);
      if (isNaN(processedValue)) {
        errors.push(`❌ ${key} must be a valid number, got: ${value}`);
        continue;
      }
    } else if (config.type === "boolean") {
      processedValue = value.toLowerCase();
    }

    // Custom validation
    if (config.validate && !config.validate(processedValue || value)) {
      errors.push(`❌ ${key}: ${config.error}`);
    }
  }

  // Apply defaults only for missing required variables
  for (const [key, config] of Object.entries(envConfig)) {
    const value = process.env[key];
    if (!value && config.required) {
      errors.push(`❌ Missing required environment variable: ${key}`);
    } else if (!value && config.default !== undefined) {
      process.env[key] = config.default.toString();
      applied.push(`🔧 Applied default for ${key}: ${config.default}`);
    }
  }

  // Validate required files
  for (const file of requiredFiles) {
    // file.path is now absolute
    if (!existsSync(file.path)) {
      if (!file.optional) {
        errors.push(
          `❌ Missing required file: ${file.path} (${file.description})`
        );
      }
      continue;
    }

    try {
      const content = readFileSync(file.path, "utf8");
      if (file.validate && !file.validate(content)) {
        if (!file.optional) {
          errors.push(`❌ Invalid ${file.description}: ${file.error}`);
        } else {
          warnings.push(`⚠️ Invalid ${file.description}: ${file.error}`);
        }
      }
    } catch (error) {
      if (!file.optional) {
        errors.push(`❌ Cannot read ${file.path}: ${error.message}`);
      } else {
        warnings.push(`⚠️ Cannot read ${file.path}: ${error.message}`);
      }
    }
  }

  // Additional environment-specific validations
  if (process.env.NODE_ENV === "production") {
    validateProductionEnvironment(errors, warnings);
  }

  // Report results
  if (applied.length > 0) {
    console.log("📝 Applied defaults:");
    applied.forEach((msg) => console.log(`   ${msg}`));
    console.log("");
  }

  if (warnings.length > 0) {
    console.log("⚠️  Warnings:");
    warnings.forEach((warning) => console.log(`   ${warning}`));
    console.log("");
  }

  if (errors.length > 0) {
    console.log("❌ Environment validation failed:");
    errors.forEach((error) => console.log(`   ${error}`));
    console.log("\n💡 Please check your .env file and required files.");
    process.exit(1);
  }

  console.log("✅ Environment configuration is valid");

  // Show configuration summary
  showConfigurationSummary();

  return true;
}

/**
 * Additional validations for production environment
 */
function validateProductionEnvironment(errors, warnings) {
  // JWT secret strength in production
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.length < 64) {
    warnings.push("JWT_SECRET should be at least 64 characters in production");
  }

  // CORS configuration in production
  if (process.env.CORS_ORIGIN === "*") {
    warnings.push("CORS_ORIGIN should not be * in production");
  }

  // HTTPS requirement
  if (!process.env.HTTPS_ENABLED || process.env.HTTPS_ENABLED === "false") {
    warnings.push("HTTPS should be enabled in production");
  } else {
    const certPath = process.env.SSL_CERT_PATH;
    const keyPath = process.env.SSL_KEY_PATH;
    if (!certPath || !existsSync(certPath)) {
      errors.push("SSL_CERT_PATH must exist when HTTPS_ENABLED=true");
    }
    if (!keyPath || !existsSync(keyPath)) {
      errors.push("SSL_KEY_PATH must exist when HTTPS_ENABLED=true");
    }
  }

  // Trust proxy should be set if behind reverse proxy
  if (!process.env.TRUST_PROXY) {
    warnings.push("TRUST_PROXY should be set if behind reverse proxy");
  }

  // Rate limiting should be stricter
  const rateLimit = parseInt(process.env.RATE_LIMIT_MAX) || 100;
  if (rateLimit > 1000) {
    warnings.push("RATE_LIMIT_MAX seems high for production (>1000)");
  }

  // Root admin presence
  if (!process.env.ROOT_ADMIN_EMAIL || !process.env.ROOT_ADMIN_PASSWORD) {
    warnings.push(
      "ROOT_ADMIN_EMAIL/ROOT_ADMIN_PASSWORD are recommended for bootstrap in production"
    );
  }
}

/**
 * Show configuration summary
 */
function showConfigurationSummary() {
  console.log("\n📋 Configuration Summary:");
  console.log("========================");

  // Only show variables that are actually set
  const configKeys = [
    "NODE_ENV",
    "PORT",
    "JWT_EXPIRES_IN",
    "LOG_LEVEL",
    "CORS_ORIGIN",
    "CLIENT_ORIGIN",
    "TRUST_PROXY",
    "FIREBASE_PROJECT_ID",
    "FORM_LIMIT",
    "JSON_LIMIT",
  ];

  for (const key of configKeys) {
    if (process.env[key]) {
      console.log(`${key}: ${process.env[key]}`);
    }
  }

  const jwtSecretLength = process.env.JWT_SECRET?.length || 0;
  if (jwtSecretLength > 0) {
    console.log(`JWT Secret Length: ${jwtSecretLength} characters`);
  }

  if (process.env.ROOT_ADMIN_EMAIL) {
    console.log(`Root Admin Email: ${process.env.ROOT_ADMIN_EMAIL}`);
  }

  console.log("");
}

/**
 * Generate sample .env file
 */
function generateSampleEnv() {
  const sampleEnv = `# touchAfrica™ Environment Configuration
# Copy this to .env and fill in your values

# Server Configuration
PORT=5000
NODE_ENV=development
TRUST_PROXY=false
CLIENT_ORIGIN=http://localhost:5000

# JWT Configuration (IMPORTANT: Use strong secrets in production)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-at-least-32-characters-long
JWT_REFRESH_EXPIRES_IN=7d

# Bootstrap (optional but recommended)
ROOT_ADMIN_EMAIL=admin@touchafrica.co.za
ROOT_ADMIN_PASSWORD=ChangeMe123!

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYour\\nPrivate\\nKey\\nHere\\n-----END PRIVATE KEY-----\\n"

# Security Configuration
CORS_ORIGIN=*
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Form and Request Limits
FORM_LIMIT=50kb
JSON_LIMIT=100kb

# Optional: Production-specific settings
# HTTPS_ENABLED=true
# SSL_CERT_PATH=./certs/cert.pem
# SSL_KEY_PATH=./certs/key.pem
`;

  console.log("📄 Sample .env file content:");
  console.log("============================");
  console.log(sampleEnv);
}

/**
 * Check if environment is ready for specific mode
 */
function checkEnvironmentReadiness(mode = "development") {
  const readinessChecks = {
    development: [
      () => process.env.JWT_SECRET?.length >= 32,
      () => existsSync("./secrets/serviceAccountKey.json"),
      () => process.env.FIREBASE_PROJECT_ID,
    ],
    production: [
      () => process.env.JWT_SECRET?.length >= 64,
      () => process.env.NODE_ENV === "production",
      () => process.env.CORS_ORIGIN !== "*",
      () => existsSync("./secrets/serviceAccountKey.json"),
      () => process.env.FIREBASE_PROJECT_ID,
      () =>
        process.env.LOG_LEVEL === "warn" || process.env.LOG_LEVEL === "error",
    ],
  };

  const checks = readinessChecks[mode] || readinessChecks.development;
  const passed = checks.filter((check) => check()).length;

  console.log(
    `🎯 Environment readiness for ${mode}: ${passed}/${checks.length} checks passed`
  );

  return passed === checks.length;
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case "validate":
      validateEnvironment();
      break;
    case "sample":
      generateSampleEnv();
      break;
    case "check":
      const mode = process.argv[3] || "development";
      checkEnvironmentReadiness(mode);
      break;
    default:
      console.log("Usage:");
      console.log(
        "  node validate-env.js validate  - Validate current environment"
      );
      console.log(
        "  node validate-env.js sample    - Generate sample .env file"
      );
      console.log(
        "  node validate-env.js check [mode] - Check readiness for mode (development/production)"
      );
  }
}

export { validateEnvironment, generateSampleEnv, checkEnvironmentReadiness };
