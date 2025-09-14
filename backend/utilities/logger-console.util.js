/**
 * Console-Based Logging Utility
 * Provides structured logging without external dependencies
 */

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || "info";
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };
  }

  shouldLog(level) {
    return this.logLevels[level] <= this.logLevels[this.logLevel];
  }

  formatMessage(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      service: "touchafrica-api",
      ...metadata,
    };

    if (process.env.NODE_ENV === "production") {
      return JSON.stringify(logEntry);
    } else {
      // Pretty print for development
      const metadataStr =
        Object.keys(metadata).length > 0
          ? " " + JSON.stringify(metadata, null, 2)
          : "";
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${metadataStr}`;
    }
  }

  error(message, metadata = {}) {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message, metadata));
    }
  }

  warn(message, metadata = {}) {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message, metadata));
    }
  }

  info(message, metadata = {}) {
    if (this.shouldLog("info")) {
      console.log(this.formatMessage("info", message, metadata));
    }
  }

  debug(message, metadata = {}) {
    if (this.shouldLog("debug")) {
      console.log(this.formatMessage("debug", message, metadata));
    }
  }

  // Enhanced logging methods
  performance(operation, duration, metadata = {}) {
    this.info(`Performance: ${operation}`, {
      operation,
      duration: `${duration}ms`,
      type: "performance",
      ...metadata,
    });
  }

  security(event, metadata = {}) {
    this.warn(`Security Event: ${event}`, {
      event,
      type: "security",
      ...metadata,
    });
  }

  auth(action, metadata = {}) {
    this.info(`Authentication: ${action}`, {
      action,
      type: "authentication",
      ...metadata,
    });
  }

  request(method, url, statusCode, responseTime, metadata = {}) {
    this.info(`API Request: ${method} ${url}`, {
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      type: "request",
      ...metadata,
    });
  }

  database(operation, collection, metadata = {}) {
    this.debug(`Database: ${operation}`, {
      operation,
      collection,
      type: "database",
      ...metadata,
    });
  }

  audit(action, userId, metadata = {}) {
    this.info(`Audit: ${action}`, {
      action,
      userId,
      type: "audit",
      ...metadata,
    });
  }
}

// Create and export logger instance
const logger = new Logger();

export default logger;
