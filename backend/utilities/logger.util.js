import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
import { mkdirSync } from "fs";
const logsDir = path.join(__dirname, "..", "logs");
try {
  mkdirSync(logsDir, { recursive: true });
} catch (error) {
  // Directory might already exist
}

// Custom log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(logColors);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  levels: logLevels,
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.metadata({ fillExcept: ["message", "level", "timestamp"] })
  ),
  defaultMeta: { service: "touchafrica-api" },
  transports: [
    // Console output for development
    new winston.transports.Console({
      level: process.env.NODE_ENV === "production" ? "warn" : "debug",
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length
            ? JSON.stringify(meta, null, 2)
            : "";
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
    }),

    // File transport for all logs
    new DailyRotateFile({
      filename: path.join(logsDir, "app-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),

    // Separate file for errors
    new DailyRotateFile({
      filename: path.join(logsDir, "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxSize: "20m",
      maxFiles: "30d",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),

    // HTTP request logs
    new DailyRotateFile({
      filename: path.join(logsDir, "access-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      level: "http",
      maxSize: "20m",
      maxFiles: "7d",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
});

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request start
  logger.http("Request started", {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    userId: req.user?.userId || "anonymous",
  });

  // Capture response details
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? "warn" : "http";

    logger.log(logLevel, "Request completed", {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.userId || "anonymous",
      contentLength: res.get("content-length") || 0,
    });
  });

  next();
};

// Error logging middleware
export const errorLogger = (err, req, res, next) => {
  logger.error("Request error", {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.userId || "anonymous",
    body: req.body,
    params: req.params,
    query: req.query,
  });

  next(err);
};

// Security event logger
export const securityLogger = {
  loginAttempt: (email, ip, success, reason = null) => {
    logger.info("Login attempt", {
      event: "login_attempt",
      email,
      ip,
      success,
      reason,
      timestamp: new Date().toISOString(),
    });
  },

  accessDenied: (userId, resource, ip, reason) => {
    logger.warn("Access denied", {
      event: "access_denied",
      userId,
      resource,
      ip,
      reason,
      timestamp: new Date().toISOString(),
    });
  },

  suspiciousActivity: (description, ip, userId = null, metadata = {}) => {
    logger.warn("Suspicious activity", {
      event: "suspicious_activity",
      description,
      ip,
      userId,
      metadata,
      timestamp: new Date().toISOString(),
    });
  },

  tokenRefresh: (userId, ip, success) => {
    logger.info("Token refresh", {
      event: "token_refresh",
      userId,
      ip,
      success,
      timestamp: new Date().toISOString(),
    });
  },
};

// Performance monitoring
export const performanceLogger = {
  dbQuery: (collection, operation, duration, success = true) => {
    logger.debug("Database operation", {
      event: "db_operation",
      collection,
      operation,
      duration: `${duration}ms`,
      success,
      timestamp: new Date().toISOString(),
    });
  },

  apiCall: (endpoint, method, duration, statusCode) => {
    logger.debug("API call performance", {
      event: "api_performance",
      endpoint,
      method,
      duration: `${duration}ms`,
      statusCode,
      timestamp: new Date().toISOString(),
    });
  },
};

export default logger;
