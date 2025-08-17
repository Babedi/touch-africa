// ============================================================================
// Panic Button API - Express Application Entry Point
// ----------------------------------------------------------------------------
// PURPOSE:
//   Secure, rate‑limited REST API + static asset server (public + private) for
//   the NeighbourGuard panic button service backed by Firestore.
//
// FILE RESPONSIBILITIES:
//   - Load environment variables
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

// Fail fast on critical required env (extend as needed)
const REQUIRED_ENV = [
  /* e.g. 'FIREBASE_PROJECT_ID', 'JWT_SECRET' */
];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.warn(`[warn] Missing recommended env var: ${key}`);
  }
}

// 2. IMPORTS --------------------------------------------------------------------
// 2.1. External libs
import express from "express";
import cors from "cors";
import path from "path";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import hpp from "hpp";
import xssClean from "xss-clean";
import nocache from "nocache";

// 2.2. Internal services & middleware
import { authenticateJWT } from "./middleware/auth.middleware.js";

// 2.3. Modular route handlers
import internalAdminRouter from "./modules/internal/admin/admin.route.js";
import internalLookupRouter from "./modules/internal/lookup/lookup.route.js";
import serviceRequestRouter from "./modules/internal/service.request/service.request.route.js";
import serviceInfoRouter from "./modules/general/service.info/service.info.route.js";
import externalTenantRouter from "./modules/external/tenant/tenant.route.js";
import externalTenantAdminRouter from "./modules/external/tenant.admin/tenant.admin.route.js";
import externalTenantExternalAlarmListRouter from "./modules/external/tenant.external.alarm.list/tenant.external.alarm.list.route.js";
import externalTenantExternalAlarmRouter from "./modules/external/tenant.external.alarm/tenant.external.alarm.route.js";
import externalTenantInternalAlarmListRouter from "./modules/external/tenant.internal.alarm.list/tenant.internal.alarm.list.route.js";
import externalTenantInternalAlarmRouter from "./modules/external/tenant.internal.alarm/tenant.internal.alarm.route.js";
import externalTenantExternalResponderListRouter from "./modules/external/tenant.external.responder.list/tenant.external.responder.list.route.js";
import externalTenantExternalResponderRouter from "./modules/external/tenant.external.responder/tenant.external.responder.route.js";
import externalTenantInternalResponderListRouter from "./modules/external/tenant.internal.responder.list/tenant.internal.responder.list.route.js";
import externalTenantInternalResponderRouter from "./modules/external/tenant.internal.responder/tenant.internal.responder.route.js";
import externalTenantUserRouter from "./modules/external/tenant.user/tenant.user.route.js";
import externalTenantUserPrivateRespondersRouter from "./modules/external/tenant.user.private.responders/tenant.user.private.responders.route.js";

// 3. PATH DERIVATION -------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 4. APP INITIALIZATION ----------------------------------------------------------
const app = express();
app.disable("x-powered-by"); // Hide Express fingerprint
if (process.env.TRUST_PROXY === "true") app.set("trust proxy", 1); // Required for secure cookies / rate limit accuracy behind proxy

// 5. SECURITY / CORE MIDDLEWARE --------------------------------------------------
// 5.1 Security headers
app.use(
  helmet({
    // NOTE: Add a strict CSP once front-end asset sources are finalized.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "same-site" },
    referrerPolicy: { policy: "no-referrer" },
  })
);

// 5.2 Compression (after helmet to compress final headers/body)
app.use(compression());

// 5.3 Logging (development vs production verbosity)
app.use(
  process.env.NODE_ENV === "production" ? morgan("combined") : morgan("dev")
);

// 5.4 Body & cookie parsers with explicit limits
app.use(express.json({ limit: process.env.JSON_LIMIT || "100kb" }));
app.use(
  express.urlencoded({
    extended: false,
    limit: process.env.FORM_LIMIT || "50kb",
  })
);

app.use(cookieParser());

// 5.5 Injection & pollution guards
app.use(hpp()); // Prevent query param pollution (?a=1&a=2)
app.use(xssClean()); // Basic XSS sanitization for user-supplied content

// 5.6 Rate limiting (applies to ALL requests including static assets)
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: Number(process.env.RATE_LIMIT_MAX) || 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too Many Requests",
    message: "Rate limit exceeded. Try again later.",
  },
});
app.use(apiLimiter);

// 5.7 CORS (dynamic allow-list) – minimal allowed headers / methods
const allowedOrigins = new Set([
  process.env.CLIENT_ORIGIN || `http://localhost:${process.env.PORT || 5000}`,
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "http://dalespro.co.za",
  "http://www.dalespro.co.za",
  "https://dalespro.co.za",
  "https://www.dalespro.co.za",
  // Frontend is served by this same server, no need for separate origins
]);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.has(origin)) return cb(null, true);
      return cb(new Error("CORS origin not allowed"));
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

// 6. API ROUTES -----------------------------------------------------------------
app.use(internalAdminRouter);
app.use(internalLookupRouter);
app.use(serviceRequestRouter);
app.use(serviceInfoRouter);
app.use(externalTenantRouter);
app.use(externalTenantAdminRouter);
app.use(externalTenantExternalAlarmListRouter);
app.use(externalTenantExternalAlarmRouter);
app.use(externalTenantInternalAlarmListRouter);
app.use(externalTenantInternalAlarmRouter);
app.use(externalTenantExternalResponderListRouter);
app.use(externalTenantExternalResponderRouter);
app.use(externalTenantInternalResponderListRouter);
app.use(externalTenantInternalResponderRouter);
app.use(externalTenantUserRouter);
app.use(externalTenantUserPrivateRespondersRouter);

// TEMPORARY DIAGNOSTICS -------------------------------------------------------
// Heartbeat to confirm process remains alive even if outbound requests fail
setInterval(() => {
  try {
    console.log("[heartbeat]", new Date().toISOString());
  } catch {}
}, 10000).unref();

// Self-test route that logs when invoked to verify request handling pipeline
app.get("/internal/selftest", (req, res) => {
  const stamp = new Date().toISOString();
  console.log(
    "[selftest] route invoked at",
    stamp,
    "ua=",
    req.headers["user-agent"]
  );
  res.json({ ok: true, stamp });
});

// Debug endpoint to test cookie parsing
app.get("/debug/cookies", (req, res) => {
  const stamp = new Date().toISOString();
  console.log("[debug/cookies] invoked at", stamp);
  console.log("[debug/cookies] Headers:", req.headers);
  console.log("[debug/cookies] Cookies:", req.cookies);
  console.log("[debug/cookies] Raw Cookie Header:", req.headers.cookie);

  res.json({
    timestamp: stamp,
    headers: req.headers,
    cookies: req.cookies,
    rawCookieHeader: req.headers.cookie,
    authToken: req.cookies?.authToken,
  });
});

// 7. STATIC ASSETS --------------------------------------------------------------

// Serve .well-known directory for Chrome DevTools and other discovery protocols
app.use(
  "/.well-known",
  express.static(path.join(__dirname, ".well-known"), {
    maxAge: "1h",
    setHeaders: (res, filePath) => {
      if (/\.json$/i.test(filePath)) {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "public, max-age=3600");
      } else if (/\.html$/i.test(filePath)) {
        res.setHeader("Content-Type", "text/html");
        res.setHeader("Cache-Control", "public, max-age=3600");
      }
    },
  })
);

// Serve modal components
app.use(
  "/modals",
  express.static(path.join(__dirname, "frontend", "public", "modals"), {
    maxAge: "1d",
    setHeaders: (res, filePath) => {
      if (/\.html$/i.test(filePath)) {
        res.setHeader("Content-Type", "text/html");
        res.setHeader("Cache-Control", "no-cache");
      } else if (/\.css$/i.test(filePath)) {
        res.setHeader("Content-Type", "text/css");
        res.setHeader("Cache-Control", "public, max-age=86400");
      } else if (/\.js$/i.test(filePath)) {
        res.setHeader("Content-Type", "application/javascript");
        res.setHeader("Cache-Control", "public, max-age=86400");
      }
    },
  })
);

// Serve shared assets (CSS, JS utilities)
app.use(
  "/shared",
  express.static(path.join(__dirname, "frontend", "shared"), {
    maxAge: "1d",
    setHeaders: (res, filePath) => {
      if (/\.css$/i.test(filePath)) {
        res.setHeader("Content-Type", "text/css");
      } else if (/\.js$/i.test(filePath)) {
        res.setHeader("Content-Type", "application/javascript");
      }
    },
  })
);

// Serve public assets (images, fonts, etc.)
app.use(
  "/assets",
  express.static(path.join(__dirname, "frontend", "public", "assets"), {
    maxAge: "30d",
    setHeaders: (res, filePath) => {
      res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
    },
  })
);

// Public: long-lived immutable caching (fingerprinted assets recommended)
app.use(
  express.static(path.join(__dirname, "frontend", "public"), {
    index: false, // Don't serve index.html automatically
    extensions: ["html", "htm", "js", "css"],
    fallthrough: true,
    setHeaders: (res, filePath) => {
      if (/\.(html?)$/i.test(filePath)) {
        // HTML should not be aggressively cached to allow deployments to propagate
        res.setHeader("Cache-Control", "no-cache");
      } else if (/\.css$/i.test(filePath)) {
        res.setHeader("Content-Type", "text/css");
        res.setHeader("Cache-Control", "public, max-age=86400");
      } else if (/\.js$/i.test(filePath)) {
        res.setHeader("Content-Type", "application/javascript");
        res.setHeader("Cache-Control", "public, max-age=86400");
      } else {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  })
);

// Private static with role-based authorization
import { authorize } from "./middleware/authorize.middleware.js";

function noStoreHeaders(res) {
  res.setHeader("Cache-Control", "no-store");
}

// Backward compatibility redirect for old admin dashboard URL
app.get(
  "/private/internal/dashboard/admin.dashboard.html",
  authenticateJWT,
  authorize("internalSuperAdmin", "internalRootAdmin"),
  (req, res) => {
    res.redirect(301, "/private/internal/dashboard/");
  }
);

// Backward compatibility redirects for tenant dashboard URLs
app.get(
  "/private/external/tenant.admin/dashboard.html",
  authenticateJWT,
  authorize("externalSuperAdmin", "externalAdmin", "tenantAdmin"),
  (req, res) => {
    res.redirect(301, "/private/external/tenant.admin/dashboard/");
  }
);

app.get(
  "/private/external/tenant.user/dashboard.html",
  authenticateJWT,
  authorize("tenantUser"),
  (req, res) => {
    res.redirect(301, "/private/external/tenant.user/dashboard/");
  }
);

// DEVELOPMENT ONLY: Allow dashboard access without auth for debugging
console.log("🔧 NODE_ENV:", JSON.stringify(process.env.NODE_ENV));
if (process.env.NODE_ENV?.trim() === "development") {
  console.log("🔧 Registering development dashboard route");
  app.use(
    "/private/internal/dashboard",
    (req, res, next) => {
      console.log("🔧 Development dashboard route hit:", req.url);
      next();
    },
    express.static(
      path.join(__dirname, "frontend", "private", "internal", "dashboard"),
      {
        extensions: ["html", "htm"],
        fallthrough: true,
        setHeaders: noStoreHeaders,
      }
    )
  );
} else {
  console.log(
    "🔧 Development dashboard route NOT registered - NODE_ENV is:",
    JSON.stringify(process.env.NODE_ENV)
  );
}

// Internal Admin only
app.use(
  "/private/internal",
  authenticateJWT,
  authorize("internalSuperAdmin", "internalRootAdmin"),
  express.static(path.join(__dirname, "frontend", "private", "internal"), {
    extensions: ["html", "htm"],
    fallthrough: true,
    setHeaders: noStoreHeaders,
  })
);

// Tenant Admin only
app.use(
  "/private/external/tenant.admin",
  authenticateJWT,
  authorize("externalSuperAdmin", "externalAdmin", "tenantAdmin"),
  express.static(
    path.join(__dirname, "frontend", "private", "external", "tenant.admin"),
    {
      extensions: ["html", "htm"],
      fallthrough: true,
      setHeaders: noStoreHeaders,
    }
  )
);

// Tenant User only
app.use(
  "/private/external/tenant.user",
  authenticateJWT,
  authorize("tenantUser", "tenantUser"), // Add tenantUser role
  express.static(
    path.join(__dirname, "frontend", "private", "external", "tenant.user"),
    {
      extensions: ["html", "htm"],
      fallthrough: true,
      setHeaders: noStoreHeaders,
    }
  )
);

// 8. ROOT ROUTE ----------------------------------------------------------------
app.get("/", (_req, res) => {
  // Set security headers for HTML
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.sendFile(path.join(__dirname, "frontend", "public", "index.html"));
});

// Favicon route
app.get("/favicon.ico", (_req, res) => {
  res.sendFile(
    path.join(__dirname, "frontend", "public", "assets", "favicon.ico")
  );
});

// Lightweight health check (no auth)
app.get("/internal/health", (_req, res) => {
  res.status(200).json({ status: "ok", time: new Date().toISOString() });
});

// Debug whoami (auth required)
app.get("/internal/whoami", authenticateJWT, (req, res) => {
  const principal = req.admin || req.user || null;
  res.json({ success: true, principal });
});

// Catch-all route for SPA routing (non-API routes)
app.get("*", (req, res) => {
  // Only serve the SPA for non-API routes and non-static files
  if (
    !req.path.startsWith("/api/") &&
    !req.path.startsWith("/internal/") &&
    !req.path.startsWith("/external/") &&
    !req.path.startsWith("/general/") &&
    !req.path.startsWith("/services/") &&
    !req.path.startsWith("/public/") &&
    !req.path.startsWith("/private/") &&
    !req.path.includes(".")
  ) {
    res.sendFile(path.join(__dirname, "frontend", "public", "index.html"));
  } else {
    // Let it fall through to 404 handler
    res.status(404).json({
      error: "Route Not Found",
      path: req.originalUrl,
      message: "The requested endpoint does not exist.",
      redirection: "/",
    });
  }
});

// 9. 404 HANDLER & ERROR HANDLERS ----------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    error: "Route Not Found",
    path: req.originalUrl,
    message: "The requested endpoint does not exist.",
    redirection: "/",
  });
});

app.use((err, _req, res, _next) => {
  console.log("🔍 Global Error Handler - Error caught:", err);
  console.log("  Error type:", typeof err);
  console.log("  Error name:", err.name);
  console.log("  Error message:", err.message);
  console.log("  Error status:", err.status);

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or missing authentication token.",
      redirection: "/",
    });
  }
  if (err.message === "CORS origin not allowed") {
    return res
      .status(403)
      .json({ error: "CORSRejected", message: err.message });
  }
  return res.status(err.status || 500).json({
    error: "Internal Server Error",
    message: err.message || "An unexpected error occurred.",
    details: err.details || undefined,
    redirection: "/",
  });
});

// 10. SHUTDOWN HANDLING ---------------------------------------------------------
function shutdown(signal) {
  console.log(`[shutdown] Received ${signal}. Closing server...`);
  server.close(() => {
    console.log("[shutdown] HTTP server closed.");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref(); // Force exit safety net
}
process.on("unhandledRejection", (reason) =>
  console.error("Unhandled Rejection:", reason)
);
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  shutdown("uncaughtException");
});

["SIGINT", "SIGTERM"].forEach((sig) => process.on(sig, () => shutdown(sig)));

// 11. START SERVER --------------------------------------------------------------
const PORT_ARG = process.argv[2];
const PORT =
  PORT_ARG ||
  process.env.API_PORT ||
  process.env.POSTS_PORT ||
  process.env.PORT ||
  5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
