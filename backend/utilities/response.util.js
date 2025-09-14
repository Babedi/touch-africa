/**
 * Standardized Response Utilities
 *
 * Provides consistent response formatting for all API endpoints
 * following the TouchAfrica API response standards.
 */

/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const sendSuccess = (res, data, message, statusCode = 200) => {
  return res.status(statusCode).json({
    data,
    message,
    status: "success",
  });
};

/**
 * Send a list response with pagination
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination object with page, limit, total, pages
 * @param {string} message - Success message (optional)
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const sendList = (
  res,
  data,
  pagination = null,
  message = null,
  statusCode = 200
) => {
  const response = {
    data,
    ...(pagination && { pagination }),
    ...(message && { message }),
    status: "success",
  };

  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {*} details - Additional error details (optional)
 * @param {number} statusCode - HTTP status code (default: 500)
 */
export const sendError = (
  res,
  code,
  message,
  details = null,
  statusCode = 500
) => {
  const errorResponse = {
    error: {
      code,
      message,
      ...(details && { details }),
    },
    status: "error",
  };

  return res.status(statusCode).json(errorResponse);
};

/**
 * Send a validation error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {*} details - Validation error details
 */
export const sendValidationError = (
  res,
  message = "Validation failed",
  details = null
) => {
  return sendError(res, "VALIDATION_ERROR", message, details, 400);
};

/**
 * Send a not found error response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name
 * @param {string} identifier - Resource identifier (optional)
 */
export const sendNotFound = (res, resource = "Resource", identifier = null) => {
  const message = identifier
    ? `${resource} with ID ${identifier} not found`
    : `${resource} not found`;

  return sendError(res, "NOT_FOUND", message, null, 404);
};

/**
 * Send an unauthorized error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const sendUnauthorized = (res, message = "Authentication required") => {
  return sendError(res, "UNAUTHORIZED", message, null, 401);
};

/**
 * Send a forbidden error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const sendForbidden = (res, message = "Insufficient permissions") => {
  return sendError(res, "FORBIDDEN", message, null, 403);
};

/**
 * Send a conflict error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {*} details - Additional details (optional)
 */
export const sendConflict = (
  res,
  message = "Resource conflict",
  details = null
) => {
  return sendError(res, "CONFLICT", message, details, 409);
};

/**
 * Handle Zod validation errors
 * @param {Object} res - Express response object
 * @param {Object} error - Zod error object
 * @param {string} contextMessage - Context-specific message (optional)
 */
export const handleZodError = (
  res,
  error,
  contextMessage = "Request validation failed"
) => {
  const formattedErrors = error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
    code: err.code,
  }));

  return sendValidationError(res, contextMessage, formattedErrors);
};

/**
 * Enhanced validation error response with user-friendly messages
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {*} details - Validation error details
 * @param {*} suggestions - Helpful suggestions for fixing errors (optional)
 */
export const sendValidationErrorEnhanced = (
  res,
  message = "Validation failed",
  details = null,
  suggestions = null
) => {
  const errorResponse = {
    error: {
      code: "VALIDATION_ERROR",
      message,
      ...(details && { details }),
      ...(suggestions && { suggestions }),
    },
    status: "error",
  };

  return res.status(400).json(errorResponse);
};

/**
 * Create pagination object
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @returns {Object} Pagination object
 */
export const createPagination = (page, limit, total) => {
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total: parseInt(total),
    pages: Math.ceil(total / limit),
  };
};

/**
 * Default export with all utility functions
 */
export default {
  sendSuccess,
  sendList,
  sendError,
  sendValidationError,
  sendValidationErrorEnhanced,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendConflict,
  handleZodError,
  createPagination,
};
