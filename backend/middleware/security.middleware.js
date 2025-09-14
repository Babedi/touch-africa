import rateLimit from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";
import xssClean from "xss-clean";

/**
 * Enhanced security middleware collection
 */

// General API rate limiting
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip}, URL: ${req.url}`);
    res.status(429).json({
      success: false,
      error: "Too many requests from this IP, please try again later.",
      retryAfter: "15 minutes",
    });
  },
});

// Strict authentication rate limiting
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    error: "Too many authentication attempts. Please try again later.",
    retryAfter: "15 minutes",
  },
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    console.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: "Too many authentication attempts. Please try again later.",
      retryAfter: "15 minutes",
    });
  },
});

// Strict rate limiting for sensitive operations
export const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // very limited requests
  message: {
    success: false,
    error: "Rate limit exceeded for sensitive operation.",
    retryAfter: "5 minutes",
  },
  skipSuccessfulRequests: false,
});

// Enhanced security headers with environment-aware CSP
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives:
      process.env.NODE_ENV === "development"
        ? {
            // Development: More permissive CSP for debugging and functionality
            defaultSrc: ["'self'"],
            styleSrc: [
              "'self'",
              "'unsafe-inline'",
              "'unsafe-eval'",
              "https://cdnjs.cloudflare.com",
              "data:",
            ],
            scriptSrc: [
              "'self'",
              "'unsafe-inline'",
              "'unsafe-eval'",
              "https://cdnjs.cloudflare.com",
              "blob:",
              "http://localhost:3000",
              "http://localhost:*",
            ],
            imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
            connectSrc: [
              "'self'",
              "http://localhost:5000",
              "ws://localhost:5000",
              "http://localhost:*",
              "ws://localhost:*",
            ],
            fontSrc: [
              "'self'",
              "data:",
              "https://cdnjs.cloudflare.com",
              "https://fonts.googleapis.com",
              "https://fonts.gstatic.com",
            ],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'", "data:", "blob:"],
            frameSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: [],
          }
        : {
            // Production: Allow necessary inline scripts for dashboard functionality
            defaultSrc: ["'self'"],
            styleSrc: [
              "'self'",
              "'unsafe-inline'", // Required for dynamic CSS updates
              "https://cdnjs.cloudflare.com",
              "data:",
            ],
            scriptSrc: [
              "'self'",
              "'unsafe-inline'", // Required for dashboard initialization
              "https://cdnjs.cloudflare.com",
            ],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: [
              "'self'",
              "http://localhost:5000",
              "ws://localhost:5000",
            ],
            fontSrc: [
              "'self'",
              "data:",
              "https://cdnjs.cloudflare.com",
              "https://fonts.googleapis.com",
              "https://fonts.gstatic.com",
            ],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'", "data:", "blob:"],
            frameSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
          },
  },
  crossOriginResourcePolicy: { policy: "same-site" },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: "no-referrer" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// XSS protection
export const xssProtection = xssClean();

// HTTP Parameter Pollution protection
export const hppProtection = hpp({
  whitelist: ["sort", "filter"], // Allow arrays for these parameters
});

// Request size limiting
export const requestSizeLimit = (req, res, next) => {
  const contentLength = parseInt(req.headers["content-length"]) || 0;
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      error: "Request entity too large",
    });
  }

  next();
};

// Security monitoring middleware
export const securityMonitor = (req, res, next) => {
  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//,
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onclick/i,
    /onerror/i,
    /onload/i,
  ];

  const urlToCheck = req.url + JSON.stringify(req.body || {});

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(urlToCheck)) {
      console.warn(`Suspicious request detected from IP ${req.ip}: ${req.url}`);
      // Don't block, just log for now
      break;
    }
  }

  next();
};

// IP whitelist middleware (optional)
export const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next(); // No whitelist configured
    }

    const clientIP = req.ip || req.connection.remoteAddress;

    if (!allowedIPs.includes(clientIP)) {
      console.warn(`Access denied for IP: ${clientIP}`);
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    next();
  };
};
