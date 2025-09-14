import logger from "./logger-console.util.js";

/**
 * Enhanced error handling utilities
 */

// Custom error classes
export class APIError extends Error {
  constructor(message, statusCode = 500, code = null, details = null) {
    super(message);
    this.name = "APIError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

export class ValidationError extends APIError {
  constructor(message, field = null, value = null) {
    super(message, 400, "VALIDATION_ERROR");
    this.field = field;
    this.value = value;
  }
}

export class AuthenticationError extends APIError {
  constructor(message = "Authentication failed") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

export class AuthorizationError extends APIError {
  constructor(message = "Insufficient permissions") {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

export class NotFoundError extends APIError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class ConflictError extends APIError {
  constructor(message = "Resource conflict") {
    super(message, 409, "CONFLICT");
  }
}

export class RateLimitError extends APIError {
  constructor(message = "Rate limit exceeded") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
  }
}

// Async wrapper to catch errors automatically
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handler middleware
export const globalErrorHandler = (err, req, res, next) => {
  // Log the error
  logger.error("Unhandled error", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?.userId || "anonymous",
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === "development";

  // Handle different error types
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
      status: "error",
      ...(isDevelopment && { stack: err.stack }),
    });
  }

  // Handle validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: err.errors || err.message,
      },
      status: "error",
      ...(isDevelopment && { stack: err.stack }),
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid token",
      },
      status: "error",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: {
        code: "TOKEN_EXPIRED",
        message: "Token expired",
      },
      status: "error",
    });
  }

  // Handle Firestore errors
  if (err.code === "permission-denied") {
    return res.status(403).json({
      error: {
        code: "DATABASE_PERMISSION_DENIED",
        message: "Database permission denied",
      },
      status: "error",
    });
  }

  if (err.code === "not-found") {
    return res.status(404).json({
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: "Resource not found",
      },
      status: "error",
    });
  }

  // Handle syntax errors
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Invalid JSON in request body",
      },
      status: "error",
    });
  }

  // Handle CORS errors
  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({
      error: {
        code: "CORS_ERROR",
        message: "CORS policy violation",
      },
      status: "error",
    });
  }

  // Default error response
  const statusCode = err.status || err.statusCode || 500;
  const message = isDevelopment ? err.message : "Internal server error";

  res.status(statusCode).json({
    error: {
      code: "INTERNAL_ERROR",
      message,
    },
    status: "error",
    ...(isDevelopment && {
      stack: err.stack,
      details: err,
    }),
  });
};

// 404 handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Route ${req.method} ${req.url} not found`,
    },
    status: "error",
  });
};

// Process error handlers
export const setupProcessErrorHandlers = () => {
  // Handle uncaught exceptions
  process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception", {
      error: err.message,
      stack: err.stack,
    });

    // Graceful shutdown
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection", {
      reason,
      promise,
    });

    // Graceful shutdown
    process.exit(1);
  });

  // Handle SIGTERM
  process.on("SIGTERM", () => {
    logger.info("SIGTERM received, shutting down gracefully");
    process.exit(0);
  });

  // Handle SIGINT
  process.on("SIGINT", () => {
    logger.info("SIGINT received, shutting down gracefully");
    process.exit(0);
  });
};

// Validation helper
export const validateRequired = (data, requiredFields) => {
  const missing = [];

  for (const field of requiredFields) {
    if (
      data[field] === undefined ||
      data[field] === null ||
      data[field] === ""
    ) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(", ")}`,
      missing
    );
  }
};

// Safe JSON parse
export const safeJsonParse = (jsonString, defaultValue = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    logger.warn("JSON parse error", { jsonString, error: error.message });
    return defaultValue;
  }
};

// Retry mechanism for operations
export const retry = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        break;
      }

      logger.warn(`Operation failed, attempt ${attempt}/${maxRetries}`, {
        error: error.message,
        attempt,
        nextRetryIn: `${delay}ms`,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }

  throw lastError;
};
