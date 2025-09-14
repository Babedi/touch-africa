import { z } from "zod";
import {
  PersonSchema,
  PersonUpdateSchema,
  // generateValidSAId, // Commented out due to simplified SA ID validation
} from "./person.validation.js";
import {
  checkPermissions,
  checkAllPermissions,
} from "../../../../middleware/permission.middleware.js";
import {
  createPersonRecord,
  getPersonRecord,
  updatePersonRecord,
  deletePersonRecord,
  getAllPersonRecords,
  searchPersonRecords,
  bulkPersonRecords,
  exportPersonRecords,
  getPersonStatistics,
  validatePersonDataConsistency,
} from "./person.service.js";
import {
  sendSuccess,
  sendList,
  sendError,
  sendValidationError,
  sendNotFound,
  sendConflict,
  handleZodError,
} from "../../../../utilities/response.util.js";
import {
  formatPaginatedResponse,
  createExportResponse,
} from "../../../../utilities/query.util.js";

/**
 * Person Controller
 * Handles HTTP requests for person management
 */

// Define role-based access control
// Permissions defined in route handlers directly

// Permissions defined in route handlers directly

/**
 * Extract actor information from request
 * @param {Object} req - Express request object
 * @returns {string} Actor identifier
 */
function actorFrom(req) {
  const p = req.admin || req.user || {};
  return p.id || p.email || "anonymous";
}

/**
 * Transform Zod validation errors into user-friendly messages
 * @param {Object} zodError - Zod validation error object
 * @returns {Object} Formatted error response
 */
function formatValidationErrors(zodError) {
  const fieldErrors = {};
  const errorDescriptions = {
    // Identity fields
    idNumber: {
      invalid_type: "ID number must be a valid text value",
      too_small: "ID number is required",
      invalid_string:
        "SA ID number must be exactly 13 digits (e.g., 8001015009087)",
    },
    firstName: {
      too_small: "First name is required and cannot be empty",
      invalid_type: "First name must be text",
    },
    surname: {
      too_small: "Surname is required and cannot be empty",
      invalid_type: "Surname must be text",
    },
    dateOfBirth: {
      invalid_date:
        "Date of birth must be in YYYY-MM-DD format (e.g., 1980-01-15)",
      invalid_type: "Date of birth must be a valid date",
    },
    gender: {
      invalid_enum_value:
        "Gender must be one of: Male, Female, Non-binary, Other, Unspecified",
    },
    citizenshipStatus: {
      invalid_enum_value:
        "Citizenship status must be one of: South African, Permanent Resident, Foreigner",
    },
    // Contact fields
    "contact.email": {
      invalid_string:
        "Please enter a valid email address (e.g., user@example.com)",
    },
    "contact.mobile": {
      invalid_string:
        "Mobile number must be in SA format: +27xxxxxxxxx or 0xxxxxxxxx",
    },
    "contact.home": {
      invalid_string:
        "Home number must be in SA format: +27xxxxxxxxx or 0xxxxxxxxx",
    },
    "contact.work": {
      invalid_string:
        "Work number must be in SA format: +27xxxxxxxxx or 0xxxxxxxxx",
    },
    // Address fields
    "addresses.residential.line1": {
      too_small: "Residential address line 1 is required",
    },
    "addresses.residential.city": {
      too_small: "Residential city is required",
    },
    "addresses.residential.province": {
      invalid_enum_value:
        "Province must be one of the 9 SA provinces (e.g., Gauteng, Western Cape)",
    },
    "addresses.residential.postalCode": {
      invalid_string: "Postal code must be 4 digits (e.g., 2000)",
    },
    // Socio-economic fields
    "socioEconomic.taxNumber": {
      invalid_string: "SARS tax number must be 9-10 digits",
    },
    "socioEconomic.uifNumber": {
      invalid_string: "UIF number must be 8-12 digits",
    },
    "socioEconomic.medicalAidNumber": {
      invalid_string: "Medical aid number format is invalid",
    },
    "socioEconomic.employmentStatus": {
      invalid_enum_value:
        "Employment status must be one of: Employed, Unemployed, Self-employed, Student, Retired, Unknown",
    },
    // Demographics
    "demographics.race": {
      invalid_enum_value:
        "Race must be one of: Black African, Coloured, Indian/Asian, White, Other, Prefer not to say",
    },
    "demographics.maritalStatus": {
      invalid_enum_value:
        "Marital status must be one of: Single, Married, Divorced, Widowed, Separated, Customary Union, Life Partner, Unknown",
    },
    "demographics.dependentsCount": {
      invalid_type: "Number of dependents must be a number",
      too_small: "Number of dependents cannot be negative",
    },
    // POPIA compliance
    "popia.consent": {
      custom: "Consent to process personal information is required",
    },
    "popia.processingBasis": {
      invalid_enum_value:
        "Processing basis must be one of: consent, contract, legal_obligation, legitimate_interest, vital_interest, public_task, other",
    },
    "popia.dataSubjectCategory": {
      invalid_enum_value:
        "Data subject category must be one of: customer, employee, contractor, student, beneficiary, other",
    },
  };

  zodError.errors.forEach((error) => {
    const fieldPath = error.path.join(".");
    const errorType = error.code;
    const fieldConfig = errorDescriptions[fieldPath];

    let message = error.message; // Default to Zod's message

    if (fieldConfig && fieldConfig[errorType]) {
      message = fieldConfig[errorType];
    } else if (fieldConfig && fieldConfig.custom) {
      message = fieldConfig.custom;
    } else {
      // Fallback for generic field descriptions
      const fieldName = error.path[error.path.length - 1];
      switch (errorType) {
        case "invalid_type":
          message = `${fieldName} must be a valid ${error.expected} value`;
          break;
        case "too_small":
          message = `${fieldName} is required`;
          break;
        case "invalid_string":
          message = `${fieldName} format is invalid`;
          break;
        case "invalid_enum_value":
          message = `${fieldName} must be one of the allowed values`;
          break;
        default:
          message = `${fieldName}: ${error.message}`;
      }
    }

    fieldErrors[fieldPath] = message;
  });

  return {
    message: "Please fix the following validation errors:",
    errors: fieldErrors,
    fieldCount: Object.keys(fieldErrors).length,
  };
}

/**
 * Create a new person
 * POST /internal/person
 */
export async function createPersonHandler(req, res, next) {
  try {
    const { tenantId } = req.params;

    console.log(
      "🔧 Creating person with data:",
      JSON.stringify(req.body, null, 2)
    );
    console.log("🔧 TenantId:", tenantId);

    // Validate request body
    const validatedData = PersonSchema.parse(req.body);

    // Additional business validation
    const consistencyCheck = validatePersonDataConsistency(validatedData);
    if (!consistencyCheck.isValid) {
      console.error(
        "❌ Person consistency validation failed:",
        consistencyCheck.errors
      );

      // Format business validation errors with descriptive messages
      const businessErrors = {};
      consistencyCheck.errors.forEach((error, index) => {
        if (error.includes("SA ID number check digit")) {
          businessErrors[`idNumber`] =
            "SA ID number check digit is invalid. Please verify the ID number is correct.";
        } else if (error.includes("Date of birth does not match")) {
          businessErrors[`dateOfBirth`] =
            "Date of birth does not match the SA ID number. Please check both fields.";
        } else if (error.includes("Date of birth cannot be in the future")) {
          businessErrors[`dateOfBirth`] =
            "Date of birth cannot be in the future. Please enter a valid birth date.";
        } else if (error.includes("Age seems unrealistic")) {
          businessErrors[`dateOfBirth`] =
            "Age seems unrealistic (over 150 years). Please check the date of birth.";
        } else {
          businessErrors[`validation_${index}`] = error;
        }
      });

      return sendValidationError(
        res,
        "Person data validation failed. Please review the following issues:",
        businessErrors
      );
    }

    const actor = actorFrom(req);
    const data = await createPersonRecord(tenantId, validatedData, actor);

    return sendSuccess(res, data, "Person created successfully", 201);
  } catch (err) {
    console.error("❌ Person creation error:", err);
    if (err instanceof z.ZodError) {
      console.error(
        "❌ Zod validation errors:",
        JSON.stringify(err.errors, null, 2)
      );

      const formattedErrors = formatValidationErrors(err);
      return sendValidationError(
        res,
        formattedErrors.message,
        formattedErrors.errors
      );
    }

    // Handle duplicate errors
    if (
      err.code === "DUPLICATE_PERSON" ||
      err.status === 409 ||
      (err.message || "").includes("already exists")
    ) {
      const message =
        "A person with this SA ID number already exists in the system. Each person must have a unique ID number.";
      return sendConflict(res, message, {
        field: "idNumber",
        suggestion:
          "Please verify the ID number or check if this person is already registered.",
      });
    }

    // Handle other service errors with descriptive messages
    if (err.message) {
      if (err.message.includes("Firestore")) {
        return sendError(
          res,
          "Database error occurred while creating person. Please try again.",
          500
        );
      }
      if (err.message.includes("network") || err.message.includes("timeout")) {
        return sendError(
          res,
          "Network error occurred. Please check your connection and try again.",
          503
        );
      }
    }

    next(err);
  }
}

/**
 * Get person by ID
 * GET /internal/person/:id
 */
export async function getPersonByIdHandler(req, res, next) {
  try {
    const { tenantId, id } = req.params;

    if (!id) {
      return sendValidationError(res, "Person ID is required");
    }

    const actor = actorFrom(req);
    const data = await getPersonRecord(tenantId, id, actor);

    if (!data) {
      return sendNotFound(res, `Person with ID ${id} not found`);
    }

    return sendSuccess(res, data, "Person retrieved successfully");
  } catch (err) {
    next(err);
  }
}

/**
 * Update person by ID
 * PUT /internal/person/:id
 */
export async function updatePersonHandler(req, res, next) {
  try {
    const { tenantId, id } = req.params;

    if (!id) {
      return sendValidationError(
        res,
        "Person ID is required to update a person record.",
        {
          id: "Person ID parameter is missing from the request",
        }
      );
    }

    // Validate request body (partial update)
    const validatedData = PersonUpdateSchema.parse(req.body);

    // Additional business validation if data provided
    const consistencyCheck = validatePersonDataConsistency(validatedData);
    if (!consistencyCheck.isValid) {
      // Format business validation errors with descriptive messages
      const businessErrors = {};
      consistencyCheck.errors.forEach((error, index) => {
        if (error.includes("Date of birth does not match")) {
          businessErrors[`dateOfBirth`] =
            "Date of birth does not match the existing SA ID number. ID numbers cannot be changed.";
        } else if (error.includes("Date of birth cannot be in the future")) {
          businessErrors[`dateOfBirth`] =
            "Date of birth cannot be in the future. Please enter a valid birth date.";
        } else if (error.includes("Age seems unrealistic")) {
          businessErrors[`dateOfBirth`] =
            "Age seems unrealistic (over 150 years). Please check the date of birth.";
        } else {
          businessErrors[`validation_${index}`] = error;
        }
      });

      return sendValidationError(
        res,
        "Person update validation failed. Please review the following issues:",
        businessErrors
      );
    }

    const actor = actorFrom(req);
    const data = await updatePersonRecord(tenantId, id, validatedData, actor);

    return sendSuccess(res, data, "Person updated successfully");
  } catch (err) {
    if (err instanceof z.ZodError) {
      const formattedErrors = formatValidationErrors(err);
      return sendValidationError(
        res,
        `Person update failed: ${formattedErrors.message}`,
        formattedErrors.errors
      );
    }

    // Handle not found errors
    if (err.message.includes("not found")) {
      return sendNotFound(
        res,
        `Person with ID '${id}' was not found in tenant '${tenantId}'. Please verify the person ID and try again.`
      );
    }

    // Handle duplicate errors (though less likely in updates)
    if (
      err.code === "DUPLICATE_PERSON" ||
      err.status === 409 ||
      (err.message || "").includes("already exists")
    ) {
      const message =
        "Update failed: This would create a duplicate person record. Each person must have unique identifying information.";
      return sendConflict(res, message, {
        field: "idNumber",
        suggestion:
          "Please verify the person details are correct and not already in use.",
      });
    }

    // Handle other service errors
    if (err.message) {
      if (err.message.includes("Firestore")) {
        return sendError(
          res,
          "Database error occurred while updating person. Please try again.",
          500
        );
      }
      if (err.message.includes("network") || err.message.includes("timeout")) {
        return sendError(
          res,
          "Network error occurred. Please check your connection and try again.",
          503
        );
      }
    }

    next(err);
  }
}

/**
 * Delete person by ID
 * DELETE /internal/person/:id
 */
export async function deletePersonHandler(req, res, next) {
  try {
    const { tenantId, id } = req.params;

    if (!id) {
      return sendValidationError(
        res,
        "Person ID is required to delete a person record.",
        {
          id: "Person ID parameter is missing from the request",
        }
      );
    }

    const actor = actorFrom(req);
    const success = await deletePersonRecord(tenantId, id, actor);

    if (!success) {
      return sendNotFound(
        res,
        `Person with ID '${id}' was not found in tenant '${tenantId}'. The person may have already been deleted or the ID is incorrect.`
      );
    }

    return sendSuccess(
      res,
      { message: "Person deleted successfully" },
      "Person deleted successfully"
    );
  } catch (err) {
    // Handle not found errors
    if (err.message.includes("not found")) {
      return sendNotFound(
        res,
        `Person with ID '${id}' was not found in tenant '${tenantId}'. The person may have already been deleted or the ID is incorrect.`
      );
    }

    // Handle reference/dependency errors
    if (
      err.message.includes("referenced") ||
      err.message.includes("dependency")
    ) {
      return sendConflict(
        res,
        "Cannot delete person: This person is referenced by other records. Please remove all references before deleting.",
        {
          suggestion:
            "Check for related data such as transactions, relationships, or other dependencies.",
        }
      );
    }

    // Handle permission errors
    if (
      err.message.includes("permission") ||
      err.message.includes("unauthorized")
    ) {
      return sendForbidden(
        res,
        "You do not have permission to delete this person record. Please contact your administrator."
      );
    }

    // Handle database errors
    if (err.message.includes("Firestore")) {
      return sendError(
        res,
        "Database error occurred while deleting person. Please try again.",
        500
      );
    }

    // Handle network errors
    if (err.message.includes("network") || err.message.includes("timeout")) {
      return sendError(
        res,
        "Network error occurred. Please check your connection and try again.",
        503
      );
    }

    next(err);
  }
}

/**
 * Partially update person by ID
 * PATCH /internal/person/:id
 */
export async function patchPersonHandler(req, res, next) {
  try {
    const { tenantId, id } = req.params;

    if (!id) {
      return sendValidationError(
        res,
        "Person ID is required to patch a person record.",
        {
          id: "Person ID parameter is missing from the request",
        }
      );
    }

    // Validate partial update data
    const parsed = PersonUpdateSchema.partial().parse(req.body);
    const actor = actorFrom(req);

    const updatedPerson = await updatePersonRecord(tenantId, id, parsed, actor);

    return sendSuccess(
      res,
      updatedPerson,
      "Person partially updated successfully"
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      const formattedErrors = formatValidationErrors(err);
      return sendValidationError(
        res,
        `Person patch failed: ${formattedErrors.message}`,
        formattedErrors.errors
      );
    }

    // Handle not found errors
    if (err.message.includes("not found")) {
      return sendNotFound(
        res,
        `Person with ID '${id}' was not found in tenant '${tenantId}'. Please verify the person ID and try again.`
      );
    }

    // Handle duplicate errors
    if (
      err.code === "DUPLICATE_PERSON" ||
      err.status === 409 ||
      (err.message || "").includes("already exists")
    ) {
      const message =
        "Patch failed: This would create a duplicate person record. Each person must have unique identifying information.";
      return sendConflict(res, message, {
        field: "idNumber",
        suggestion:
          "Please verify the person details are correct and not already in use.",
      });
    }

    // Handle database errors
    if (err.message.includes("Firestore")) {
      return sendError(
        res,
        "Database error occurred while patching person. Please try again.",
        500
      );
    }

    // Handle network errors
    if (err.message.includes("network") || err.message.includes("timeout")) {
      return sendError(
        res,
        "Network error occurred. Please check your connection and try again.",
        503
      );
    }

    next(err);
  }
}

/**
 * Get all persons with pagination
 * GET /internal/person/list
 */
export async function listPersonsHandler(req, res, next) {
  try {
    const { tenantId } = req.params;

    const actor = actorFrom(req);
    const result = await getAllPersonRecords(tenantId, req.parsedQuery, actor);

    // Return flat list response (data array + pagination)
    return sendList(
      res,
      result.data,
      result.pagination,
      "Persons retrieved successfully"
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Search persons by criteria
 * GET /internal/person/search
 */
export async function searchPersonsHandler(req, res, next) {
  try {
    const { tenantId } = req.params;

    const actor = actorFrom(req);
    const result = await searchPersonRecords(tenantId, req.parsedQuery, actor);

    // Return flat list response (data array + pagination)
    return sendList(
      res,
      result.data,
      result.pagination,
      "Person search completed successfully"
    );
  } catch (err) {
    // Handle query validation errors
    if (
      err.message.includes("Invalid search criteria") ||
      err.message.includes("query")
    ) {
      return sendValidationError(
        res,
        "Invalid search criteria provided. Please check your search parameters.",
        {
          query: "Search parameters are invalid or malformed",
        }
      );
    }

    // Handle database errors
    if (err.message.includes("Firestore")) {
      return sendError(
        res,
        "Database error occurred while searching persons. Please try again.",
        500
      );
    }

    // Handle network errors
    if (err.message.includes("network") || err.message.includes("timeout")) {
      return sendError(
        res,
        "Network error occurred. Please check your connection and try again.",
        503
      );
    }

    next(err);
  }
}

/**
 * Bulk operations for persons
 * POST /internal/person/bulk
 */
export async function bulkPersonsHandler(req, res, next) {
  try {
    const { tenantId } = req.params;
    const { operation, data, filters } = req.body;

    // Validate required fields
    if (!operation) {
      return sendValidationError(res, "Bulk operation type is required.", {
        operation:
          "Operation field must be specified (create, update, delete, etc.)",
      });
    }

    if (!data && !filters) {
      return sendValidationError(
        res,
        "Either data or filters must be provided for bulk operations.",
        {
          data: "Data array or filters criteria is required for bulk operations",
        }
      );
    }

    const actor = actorFrom(req);

    const result = await bulkPersonRecords(
      tenantId,
      operation,
      data,
      filters,
      actor
    );

    return sendSuccess(res, result, `Bulk ${operation} completed successfully`);
  } catch (err) {
    // Handle validation errors for bulk data
    if (err instanceof z.ZodError) {
      const formattedErrors = formatValidationErrors(err);
      return sendValidationError(
        res,
        `Bulk operation validation failed: ${formattedErrors.message}`,
        formattedErrors.errors
      );
    }

    // Handle unsupported operation
    if (
      err.message.includes("Unsupported operation") ||
      err.message.includes("Invalid operation")
    ) {
      return sendValidationError(
        res,
        "Unsupported bulk operation. Please use a valid operation type.",
        {
          operation:
            "Operation must be one of: create, update, delete, archive, etc.",
        }
      );
    }

    // Handle permission errors
    if (
      err.message.includes("permission") ||
      err.message.includes("unauthorized")
    ) {
      return sendForbidden(
        res,
        "You do not have permission to perform bulk operations on person records. Please contact your administrator."
      );
    }

    // Handle database errors
    if (err.message.includes("Firestore")) {
      return sendError(
        res,
        "Database error occurred during bulk operation. Please try again.",
        500
      );
    }

    // Handle network errors
    if (err.message.includes("network") || err.message.includes("timeout")) {
      return sendError(
        res,
        "Network error occurred. Please check your connection and try again.",
        503
      );
    }

    next(err);
  }
}

/**
 * Export persons
 * GET /internal/person/export
 */
export async function exportPersonsHandler(req, res, next) {
  try {
    const { tenantId } = req.params;
    const { format = "csv" } = req.query;

    // Validate export format
    if (!["csv", "xlsx", "json"].includes(format.toLowerCase())) {
      return sendValidationError(
        res,
        "Invalid export format. Supported formats are: csv, xlsx, json.",
        {
          format: "Export format must be one of: csv, xlsx, json",
        }
      );
    }

    const actor = actorFrom(req);
    const result = await exportPersonRecords(
      tenantId,
      req.parsedQuery,
      format,
      actor
    );

    // Create export response
    const exportResponse = createExportResponse(result.data, format, "persons");

    res.setHeader("Content-Type", exportResponse.contentType);
    res.setHeader("Content-Disposition", exportResponse.disposition);

    return res.send(exportResponse.content);
  } catch (err) {
    // Handle permission errors
    if (
      err.message.includes("permission") ||
      err.message.includes("unauthorized")
    ) {
      return sendForbidden(
        res,
        "You do not have permission to export person records. Please contact your administrator."
      );
    }

    // Handle export size limits
    if (
      err.message.includes("too large") ||
      err.message.includes("limit exceeded")
    ) {
      return sendValidationError(
        res,
        "Export request too large. Please apply filters to reduce the number of records.",
        {
          suggestion:
            "Use date ranges, status filters, or other criteria to limit the export size",
        }
      );
    }

    // Handle database errors
    if (err.message.includes("Firestore")) {
      return sendError(
        res,
        "Database error occurred during export. Please try again.",
        500
      );
    }

    // Handle network errors
    if (err.message.includes("network") || err.message.includes("timeout")) {
      return sendError(
        res,
        "Network error occurred. Please check your connection and try again.",
        503
      );
    }

    next(err);
  }
}

/**
 * Get person statistics (admin endpoint)
 * GET /internal/person/stats
 */
export async function getPersonStatsHandler(req, res, next) {
  try {
    const { tenantId } = req.params;

    const actor = actorFrom(req);
    const stats = await getPersonStatistics(tenantId, req.parsedQuery, actor);

    return sendSuccess(res, stats, "Person statistics retrieved successfully");
  } catch (err) {
    // Handle permission errors
    if (
      err.message.includes("permission") ||
      err.message.includes("unauthorized")
    ) {
      return sendForbidden(
        res,
        "You do not have permission to view person statistics. Please contact your administrator."
      );
    }

    // Handle database errors
    if (err.message.includes("Firestore")) {
      return sendError(
        res,
        "Database error occurred while retrieving statistics. Please try again.",
        500
      );
    }

    // Handle network errors
    if (err.message.includes("network") || err.message.includes("timeout")) {
      return sendError(
        res,
        "Network error occurred. Please check your connection and try again.",
        503
      );
    }

    next(err);
  }
}

/**
 * Get person statistics (admin endpoint)
 * GET /internal/person/statistics
 */
export async function getPersonStatisticsHandler(req, res, next) {
  try {
    const { tenantId } = req.params;

    const actor = actorFrom(req);
    const data = await getPersonStatistics(tenantId, {}, actor);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    // Handle permission errors
    if (
      err.message.includes("permission") ||
      err.message.includes("unauthorized")
    ) {
      return sendForbidden(
        res,
        "You do not have permission to view person statistics. Please contact your administrator."
      );
    }

    // Handle database errors
    if (err.message.includes("Firestore")) {
      return sendError(
        res,
        "Database error occurred while retrieving statistics. Please try again.",
        500
      );
    }

    // Handle network errors
    if (err.message.includes("network") || err.message.includes("timeout")) {
      return sendError(
        res,
        "Network error occurred. Please check your connection and try again.",
        503
      );
    }

    next(err);
  }
}

/**
 * Validate person data consistency (utility endpoint)
 * POST /internal/person/validate
 */
export async function validatePersonHandler(req, res, next) {
  try {
    // Validate request body structure first
    const validatedData = PersonSchema.parse(req.body);

    // Then check business consistency
    const consistencyCheck = validatePersonDataConsistency(validatedData);

    res.status(200).json({
      success: true,
      data: {
        isValid: consistencyCheck.isValid,
        errors: consistencyCheck.errors,
        warnings: [],
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const formattedErrors = formatValidationErrors(err);
      return res.status(200).json({
        success: true,
        data: {
          isValid: false,
          errors: Object.values(formattedErrors.errors),
          warnings: [],
          message: formattedErrors.message,
        },
      });
    }

    // Handle network errors
    if (err.message.includes("network") || err.message.includes("timeout")) {
      return sendError(
        res,
        "Network error occurred during validation. Please check your connection and try again.",
        503
      );
    }

    next(err);
  }
}
