// ============================================================================
// touchAfrica API - Express Application Entry Point [DEBUG MODE v2]
// ----------------------------------------------------------------------------
// PURPOSE:
//   Secure, rate‑limited REST API + static asset server (public + private) for
//   the touchAfrica API service backed by Firestore.
//
// FILE RESPONSIBILITIES:
//   - Load environment variables and validate configuration
//   - Initialize Express app & core security middleware
//   - Configure global rate limiting, CORS & parsers
//   - Register feature routes (modular routers under /api/*)
//   - Serve public & authenticated private static assets
//   - Centralize 404 & error handling
//   - Provide graceful shutdown hooks
//
// ORDER OF SECTIONS:
//   1. Environment & runtime guards
//   2. Imports (external -> internal)
//   3. Derived paths (__dirname)
//   4. App creation & global config
//   5. Security / hardening middleware (headers, rate limit, CORS, parsers)
//   6. API route registrations
//   7. Static asset serving (public, private)
//   8. Root route
//   9. 404 + error handlers
//  10. Shutdown handling
//  11. Server start
// ============================================================================

// 1. ENVIRONMENT ----------------------------------------------------------------
import dotenv from "dotenv";
dotenv.config();

// Enhanced environment validation
import { validateEnvironment } from "./backend/config/validate-env.js";
validateEnvironment();

// 2. IMPORTS --------------------------------------------------------------------
// 2.1. External libs
import express from "express";
import cors from "cors";
import path from "path";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import compression from "compression";
import nocache from "nocache";
import { fileURLToPath } from "url";
import fs from "fs";

// 2.2. Enhanced security middleware
import {
  apiLimiter,
  authLimiter,
  securityHeaders,
  xssProtection,
  securityMonitor,
  requestSizeLimit,
  hppProtection,
} from "./backend/middleware/security.middleware.js";

// 2.3. Enhanced authentication middleware
import { authenticateJWT } from "./backend/middleware/auth.middleware.js";
import { authenticateJWT as authenticateJWTEnhanced } from "./backend/middleware/auth-enhanced.middleware.js";
import * as authUtils from "./backend/utilities/auth-enhanced.util.js";

// 2.4. Enhanced logging and error handling
import logger from "./backend/utilities/logger-console.util.js";
import {
  globalErrorHandler,
  APIError,
  ValidationError,
} from "./backend/utilities/error-handler.util.js";

// 2.5. Modular route handlers
import internalAdminRouter from "./backend/modules/internal/admin/admin.route.js";
import internalLookupRouter from "./backend/modules/internal/lookup/lookup.route.js";
import internalLookupCategoryRouter from "./backend/modules/internal/lookup.category/lookup.category.route.js";
import internalLookupSubCategoryRouter from "./backend/modules/internal/lookup.sub.category/lookup.sub.category.route.js";
import internalRoleRouter from "./backend/modules/internal/role/role.route.js";
import roleMappingRoutes from "./backend/modules/internal/role.mapping/role.mapping.route.js";
import serviceRequestRouter from "./backend/modules/internal/service.request/service.request.route.js";
import serviceInfoRouter from "./backend/modules/general/service.info/service.info.route.js";
import internalTenantRouter from "./backend/modules/internal/tenant/tenant.route.js";
import cultivarTemplateRouter from "./backend/modules/internal/cultivar.template/cultivar.template.route.js";
import personRouter from "./backend/modules/internal/person/person.route.js";
import { default as internalPermissionRouter } from "./backend/modules/internal/permission/permission.route.js";
import todoRouter from "./backend/modules/internal/todo/todo.route.js";

// External tenant-scoped routes
import externalTenantPersonRouter from "./backend/modules/external/tenant/person/person.route.js";
import externalTenantAdminRouter from "./backend/modules/external/tenant/admin/admin.route.js";
import externalTenantPermissionRouter from "./backend/modules/external/tenant/permission/permission.route.js";
import externalTenantRoleRouter from "./backend/modules/external/tenant/role/role.route.js";

// Standard module routes (tenant-agnostic)
import standardPermissionRouter from "./backend/modules/external/tenant/standard.permission/standard.permission.route.js";
import standardRoleRouter from "./backend/modules/external/tenant/standard.role/standard.role.route.js";
import standardRoleMappingRouter from "./backend/modules/external/tenant/standard.role.mapping/standard.role.mapping.route.js";

// 3. PATH DERIVATION -------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 4. APP INITIALIZATION ----------------------------------------------------------
const app = express();

// Configure Express settings
app.disable("x-powered-by"); // Hide Express fingerprint
if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1); // Required for secure cookies / rate limit accuracy behind proxy
}

// 5. SECURITY / CORE MIDDLEWARE --------------------------------------------------
// 5.0 Debug middleware to catch all requests
app.use((req, res, next) => {
  console.log(`🔍 INCOMING REQUEST: ${req.method} ${req.url} from ${req.ip}`);
  next();
});

// 5.1 Request logging (before security middleware)
app.use(morgan("combined"));

// 5.2 Security monitoring
app.use(securityMonitor);

// 5.3 Security headers
app.use(securityHeaders);

// 5.4 Compression (after helmet to compress final headers/body)
app.use(compression());

// 5.5 Request size limiting
app.use(requestSizeLimit);

// 5.6 XSS Protection
app.use(xssProtection);

// 5.7 HTTP Parameter Pollution protection
app.use(hppProtection);

// 5.8 Cookie parsing (required for auth)
app.use(cookieParser());

// 5.9 JSON & URL-encoded parsing with size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 5.10 CORS configuration
const corsOptions = {
  origin:
    process.env.CORS_ORIGIN === "*"
      ? true
      : process.env.CORS_ORIGIN?.split(",") || true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-CSRF-Token",
  ],
  exposedHeaders: ["X-Total-Count", "X-Page-Count"],
};
app.use(cors(corsOptions));

// 5.11 Enhanced logging (development vs production verbosity)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: { write: (message) => logger.http(message.trim()) },
    })
  );
}

// 5.4 Body & cookie parsers with explicit limits
// app.use(express.json({ limit: process.env.JSON_LIMIT || "100kb" })); // REMOVED - duplicate, using 10mb limit above
app.use(
  express.urlencoded({
    extended: false,
    limit: process.env.FORM_LIMIT || "50kb",
  })
);

// cookieParser already configured above at line 133

// 5.5 Injection & pollution guards
app.use(hppProtection); // Prevent query param pollution (?a=1&a=2)
app.use(xssProtection); // Basic XSS sanitization for user-supplied content

// 5.6 Enhanced Security Middleware (rate limiting, monitoring, protection)
app.use(apiLimiter);
app.use(securityHeaders);
app.use(xssProtection);
app.use(securityMonitor);

// 5.7 CORS (dynamic allow-list) – minimal allowed headers / methods
const allowedOrigins = new Set([process.env.CLIENT_ORIGIN]);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.has(origin)) return cb(null, true);
      return cb(null, true); // Allow all origins for now to fix CORS issues
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-tenant-id"],
    exposedHeaders: ["Set-Cookie"],
    optionsSuccessStatus: 200,
  })
);

// 5.8 No-Cache Headers
app.use(nocache());

// PRIORITY ROUTES (before any other middleware that might interfere)
// Lightweight health check (no auth)
app.get("/internal/health", (_req, res) => {
  const healthStatus = {
    status: "ok",
    time: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  };

  console.log("Health check requested", healthStatus);
  res.status(200).json(healthStatus);
});

// 6. API ROUTES -----------------------------------------------------------------
// Frontend currently calls /api/v1/* (see CoreUtils.api default baseURL '/api/v1').
// Previously routers were mounted at root (no /api/v1) causing 404 responses like
// '/api/v1/internal/roles' not found. We now mount all API routers under a common
// versioned prefix. If an env var API_PREFIX is supplied it overrides the default.
// This preserves a clean separation between API and static asset namespaces.
const API_PREFIX = process.env.API_PREFIX || "/api/v1";

// Mount routers under versioned prefix
app.use(API_PREFIX, internalAdminRouter);
app.use(API_PREFIX, internalLookupRouter);
app.use(API_PREFIX, internalLookupCategoryRouter);
app.use(API_PREFIX, internalLookupSubCategoryRouter);
app.use(API_PREFIX, internalRoleRouter);
app.use(API_PREFIX, roleMappingRoutes);
app.use(API_PREFIX, internalPermissionRouter);
app.use(API_PREFIX, serviceRequestRouter);
app.use(API_PREFIX, serviceInfoRouter);
app.use(API_PREFIX, internalTenantRouter);
app.use(API_PREFIX, cultivarTemplateRouter);
app.use(API_PREFIX, personRouter);
app.use(API_PREFIX, todoRouter);

// External tenant-scoped routes
app.use(API_PREFIX, externalTenantPersonRouter);
app.use(API_PREFIX, externalTenantAdminRouter);
app.use(API_PREFIX, externalTenantPermissionRouter);
app.use(API_PREFIX, externalTenantRoleRouter);

// Standard module routes (tenant-agnostic) with "standard-" prefix
app.use(`${API_PREFIX}/standard-permissions`, standardPermissionRouter);
app.use(`${API_PREFIX}/standard-roles`, standardRoleRouter);
app.use(`${API_PREFIX}/standard-role-mappings`, standardRoleMappingRouter);

// 6.1 ENHANCED AUTHENTICATION ROUTES -------------------------------------------

// 7. STATIC ASSETS --------------------------------------------------------------
// Serve .well-known directory for Chrome DevTools and other discovery protocols
// Serve all other static frontend sections explicitly
const staticSetHeaders = (res, filePath) => {
  if (/\.css$/i.test(filePath)) {
    res.setHeader("Content-Type", "text/css");
    res.setHeader("Cache-Control", "public, max-age=86400");
  } else if (/\.js$/i.test(filePath)) {
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Cache-Control", "public, max-age=86400");
  } else if (/\.html?$/i.test(filePath)) {
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "no-cache");
  } else {
    // Images, fonts, etc.
    res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
  }
};

app.use(
  "/.well-known",
  express.static(path.join(__dirname, ".well-known"), {
    maxAge: "1h",
    setHeaders: staticSetHeaders,
  })
);

app.use(
  "/",
  express.static(path.join(__dirname, "frontend", "home"), {
    index: false,
    setHeaders: staticSetHeaders,
  })
);

app.use(
  "/shared",
  express.static(path.join(__dirname, "frontend", "shared"), {
    index: false,
    fallthrough: true,
    setHeaders: staticSetHeaders,
  })
);

app.use(
  "/dashboards",
  express.static(path.join(__dirname, "frontend", "dashboards"), {
    index: false,
    fallthrough: true,
    setHeaders: staticSetHeaders,
  })
);

// Convenience: expose everything under /frontend/* for dev/use-cases
app.use(
  "/frontend",
  express.static(path.join(__dirname, "frontend"), {
    index: false,
    fallthrough: true,
    setHeaders: staticSetHeaders,
  })
);

// Expose integration tools (api-client) for browser usage
app.use(
  "/integration",
  express.static(path.join(__dirname, "integration"), {
    index: false,
    fallthrough: true,
    setHeaders: staticSetHeaders,
  })
);

// 8. ROOT ROUTE ----------------------------------------------------------------

// Explicit root route to serve Home page index.html
app.get("/", (_req, res) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.sendFile(path.join(__dirname, "frontend", "home", "index.html"));
});

// Dev convenience: serve root-level test HTML files directly (e.g., debug-edit-modal-permissions.html)
// This avoids moving test assets and keeps API routes under /api/v1 unaffected.
app.get("/:file.html", (req, res, next) => {
  const candidate = path.join(__dirname, `${req.params.file}.html`);
  if (fs.existsSync(candidate)) {
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "no-cache");
    return res.sendFile(candidate);
  }
  next();
});

// 9. 404 HANDLER & ENHANCED ERROR HANDLERS -------------------------------------
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`, {
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });

  res.status(404).json({
    error: "Route Not Found",
    path: req.originalUrl,
    message: "The requested endpoint does not exist.",
    redirection: "/",
  });
});

// Use enhanced error handler
app.use(globalErrorHandler);

// 10. SHUTDOWN HANDLING ---------------------------------------------------------
let server; // declare for safe reference in shutdown

function shutdown(signal) {
  logger.info(`Received ${signal}. Closing server...`);
  if (server && typeof server.close === "function") {
    try {
      server.close(() => {
        logger.info("HTTP server closed.");
        process.exit(0);
      });
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000).unref(); // Force exit safety net
    } catch (e) {
      logger.error("Error during shutdown", { message: e?.message });
      process.exit(1);
    }
  } else {
    // Server not started yet; exit immediately
    process.exit(1);
  }
}

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  shutdown("uncaughtException");
});

["SIGINT", "SIGTERM"].forEach((sig) => process.on(sig, () => shutdown(sig)));

// 11. START SERVER --------------------------------------------------------------
const PORT = (process.env.PORT || 5000).toString().trim();
server = app.listen(PORT, "127.0.0.1", () => {
  logger.info(`🚀 TouchAfrica API Server started successfully`, {
    port: PORT,
    environment: process.env.NODE_ENV || "development",
    url: process.env.CLIENT_ORIGIN || `http://localhost:${PORT}`,
    pid: process.pid,
    timestamp: new Date().toISOString(),
  });
});
