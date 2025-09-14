/**
 * Enhanced Validation Utilities
 *
 * Provides comprehensive validation error formatting and utilities
 * that can be used across all modules for consistent, user-friendly
 * validation error messages.
 */

import { z } from "zod";
import { SHARED_VALIDATION_MESSAGES } from "../../shared/validation-messages.js";

/**
 * Transform Zod validation errors into user-friendly messages
 * @param {Object} zodError - Zod validation error object
 * @param {Object} customDescriptions - Custom field descriptions (optional)
 * @returns {Object} Formatted error response
 */
export function formatValidationErrors(zodError, customDescriptions = {}) {
  const fieldErrors = {};

  // Default error descriptions for common fields
  const defaultDescriptions = {
    // Identity fields (Person/User)
    idNumber: {
      invalid_type: "ID number must be a valid text value",
      too_small: "ID number is required",
      invalid_string: SHARED_VALIDATION_MESSAGES.SA_ID_NUMBER,
    },
    firstName: {
      too_small: SHARED_VALIDATION_MESSAGES.FIRST_NAME_REQUIRED,
      invalid_type: "First name must be text",
    },
    surname: {
      too_small: SHARED_VALIDATION_MESSAGES.SURNAME_REQUIRED,
      invalid_type: "Surname must be text",
    },
    lastName: {
      too_small: "Last name is required and cannot be empty",
      invalid_type: "Last name must be text",
    },
    name: {
      too_small: "Name is required and cannot be empty",
      invalid_type: "Name must be text",
    },
    displayName: {
      too_small: "Display name is required and cannot be empty",
      invalid_type: "Display name must be text",
    },
    preferredName: {
      too_small: "Preferred name is required and cannot be empty",
      invalid_type: "Preferred name must be text",
    },
    dateOfBirth: {
      invalid_date: SHARED_VALIDATION_MESSAGES.DATE_OF_BIRTH_FORMAT,
      invalid_type: "Date of birth must be a valid date",
    },
    gender: {
      invalid_enum_value: SHARED_VALIDATION_MESSAGES.GENDER_REQUIRED,
    },
    nationality: {
      too_small: "Nationality is required and cannot be empty",
      invalid_type: "Nationality must be text",
    },
    homeLanguage: {
      too_small: "Home language is required and cannot be empty",
      invalid_type: "Home language must be text",
    },
    citizenshipStatus: {
      invalid_enum_value:
        "Citizenship status must be one of: South African, Permanent Resident, Foreigner",
    },

    // Contact fields
    "contact.email": {
      invalid_string: SHARED_VALIDATION_MESSAGES.EMAIL,
    },
    email: {
      invalid_string:
        "Please enter a valid email address (e.g., user@example.com)",
    },
    "contact.mobile": {
      invalid_string:
        "Mobile number must be in SA format: +27xxxxxxxxx or 0xxxxxxxxx",
    },
    mobile: {
      invalid_string:
        "Mobile number must be in SA format: +27xxxxxxxxx or 0xxxxxxxxx",
    },
    phone: {
      invalid_string:
        "Phone number must be in SA format: +27xxxxxxxxx or 0xxxxxxxxx",
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
      too_small: SHARED_VALIDATION_MESSAGES.ADDRESS_LINE_REQUIRED,
    },
    "address.line1": {
      too_small: SHARED_VALIDATION_MESSAGES.ADDRESS_LINE_REQUIRED,
    },
    streetAddress: {
      too_small: SHARED_VALIDATION_MESSAGES.ADDRESS_LINE_REQUIRED,
    },
    "addresses.residential.city": {
      too_small: SHARED_VALIDATION_MESSAGES.CITY_REQUIRED,
    },
    "address.city": {
      too_small: SHARED_VALIDATION_MESSAGES.CITY_REQUIRED,
    },
    city: {
      too_small: SHARED_VALIDATION_MESSAGES.CITY_REQUIRED,
    },
    "addresses.residential.province": {
      invalid_enum_value: SHARED_VALIDATION_MESSAGES.PROVINCE_REQUIRED,
    },
    "address.province": {
      invalid_enum_value: SHARED_VALIDATION_MESSAGES.PROVINCE_REQUIRED,
    },
    province: {
      invalid_enum_value: SHARED_VALIDATION_MESSAGES.PROVINCE_REQUIRED,
    },
    "addresses.residential.postalCode": {
      invalid_string: SHARED_VALIDATION_MESSAGES.POSTAL_CODE_FORMAT,
    },
    "address.postalCode": {
      invalid_string: SHARED_VALIDATION_MESSAGES.POSTAL_CODE_FORMAT,
    },
    postalCode: {
      invalid_string: SHARED_VALIDATION_MESSAGES.POSTAL_CODE_FORMAT,
    },

    // Role and Permission fields
    roleCode: {
      too_small: "Role code is required",
      invalid_string: "Role code must be alphanumeric (e.g., ADMIN_USER)",
    },
    roleName: {
      too_small: "Role name is required and cannot be empty",
      invalid_type: "Role name must be text",
    },
    permissionCode: {
      too_small: "Permission code is required",
      invalid_string:
        "Permission code must be alphanumeric (e.g., CREATE_USER)",
    },
    permissionName: {
      too_small: "Permission name is required and cannot be empty",
      invalid_type: "Permission name must be text",
    },
    description: {
      too_small: "Description is required and cannot be empty",
      invalid_type: "Description must be text",
    },

    // Status and Category fields
    status: {
      invalid_enum_value:
        "Status must be one of the allowed values (e.g., active, inactive, pending)",
    },
    isActive: {
      invalid_type: "Active status must be true or false",
    },
    isEnabled: {
      invalid_type: "Enabled status must be true or false",
    },

    // Date and time fields
    createdAt: {
      invalid_date: "Created date must be in valid date format",
      invalid_type: "Created date must be a valid date",
    },
    updatedAt: {
      invalid_date: "Updated date must be in valid date format",
      invalid_type: "Updated date must be a valid date",
    },
    startDate: {
      invalid_date: "Start date must be in YYYY-MM-DD format",
      invalid_type: "Start date must be a valid date",
    },
    endDate: {
      invalid_date: "End date must be in YYYY-MM-DD format",
      invalid_type: "End date must be a valid date",
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

  // Merge custom descriptions with defaults
  const errorDescriptions = { ...defaultDescriptions, ...customDescriptions };

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
        case "invalid_date":
          message = `${fieldName} must be a valid date`;
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
 * Enhanced Zod error handler for response utilities
 * @param {Object} res - Express response object
 * @param {Object} error - Zod error object
 * @param {Object} customDescriptions - Custom field descriptions (optional)
 * @param {string} contextMessage - Context-specific message (optional)
 */
export function handleZodErrorEnhanced(
  res,
  error,
  customDescriptions = {},
  contextMessage = "Request validation failed"
) {
  const formattedErrors = formatValidationErrors(error, customDescriptions);

  return res.status(400).json({
    error: {
      code: "VALIDATION_ERROR",
      message: `${contextMessage}: ${formattedErrors.message}`,
      details: formattedErrors.errors,
    },
    status: "error",
  });
}

/**
 * Validate business logic errors with descriptive messages
 * @param {Array} errors - Array of business validation error messages
 * @param {string} context - Context of the validation (e.g., "Person creation", "Role update")
 * @returns {Object} Formatted business validation error response
 */
export function formatBusinessValidationErrors(
  errors,
  context = "Data validation"
) {
  const businessErrors = {};

  errors.forEach((error, index) => {
    // Common business validation patterns
    if (error.includes("Date of birth does not match")) {
      businessErrors[`dateOfBirth`] =
        "Date of birth does not match the existing SA ID number. ID numbers cannot be changed.";
    } else if (error.includes("Date of birth cannot be in the future")) {
      businessErrors[`dateOfBirth`] =
        "Date of birth cannot be in the future. Please enter a valid birth date.";
    } else if (error.includes("Age seems unrealistic")) {
      businessErrors[`dateOfBirth`] =
        "Age seems unrealistic (over 150 years). Please check the date of birth.";
    } else if (
      error.includes("already exists") ||
      error.includes("duplicate")
    ) {
      businessErrors[`uniqueness`] =
        "This record already exists. Each record must have unique identifying information.";
    } else if (error.includes("not found")) {
      businessErrors[`reference`] =
        "Referenced record was not found. Please verify the information is correct.";
    } else if (error.includes("permission") || error.includes("unauthorized")) {
      businessErrors[`permission`] =
        "You do not have permission to perform this action. Please contact your administrator.";
    } else {
      businessErrors[`validation_${index}`] = error;
    }
  });

  return {
    message: `${context} failed. Please review the following issues:`,
    errors: businessErrors,
    fieldCount: Object.keys(businessErrors).length,
  };
}

/**
 * Create standardized error suggestions based on error type
 * @param {string} errorType - Type of error (duplicate, not_found, permission, etc.)
 * @param {string} resourceType - Type of resource (person, role, permission, etc.)
 * @returns {string} Helpful suggestion for the user
 */
export function getErrorSuggestion(errorType, resourceType = "record") {
  const suggestions = {
    duplicate: `Please verify the ${resourceType} details are correct and not already in use.`,
    not_found: `Please verify the ${resourceType} ID and try again.`,
    permission: `Please contact your administrator for the necessary permissions.`,
    network: "Please check your connection and try again.",
    database: "Please try again. If the problem persists, contact support.",
    validation: "Please check all required fields and their formats.",
    business_logic: "Please review the business rules and requirements.",
    file_upload: "Please ensure the file is in the correct format and size.",
    export_limit:
      "Use date ranges, status filters, or other criteria to limit the export size.",
  };

  return (
    suggestions[errorType] ||
    `Please review the ${resourceType} information and try again.`
  );
}

/**
 * Format validation errors for specific modules
 * @param {Object} zodError - Zod validation error object
 * @param {string} module - Module name (person, role, permission, etc.)
 * @returns {Object} Module-specific formatted error response
 */
export function formatModuleValidationErrors(zodError, module) {
  const moduleSpecificDescriptions = {
    role: {
      roleCode: {
        too_small: "Role code is required",
        invalid_string:
          "Role code must be alphanumeric and unique (e.g., TENANT_ADMIN)",
      },
      roleName: {
        too_small: "Role name is required and cannot be empty",
        invalid_type: "Role name must be descriptive text",
      },
    },
    permission: {
      permissionCode: {
        too_small: "Permission code is required",
        invalid_string:
          "Permission code must be alphanumeric and unique (e.g., CREATE_USER)",
      },
      permissionName: {
        too_small: "Permission name is required and cannot be empty",
        invalid_type: "Permission name must be descriptive text",
      },
    },
    tenant: {
      tenantCode: {
        too_small: "Tenant code is required",
        invalid_string:
          "Tenant code must be alphanumeric and unique (e.g., CLIENT001)",
      },
      tenantName: {
        too_small: "Tenant name is required and cannot be empty",
        invalid_type: "Tenant name must be descriptive text",
      },
    },
  };

  return formatValidationErrors(
    zodError,
    moduleSpecificDescriptions[module] || {}
  );
}

export default {
  formatValidationErrors,
  handleZodErrorEnhanced,
  formatBusinessValidationErrors,
  getErrorSuggestion,
  formatModuleValidationErrors,
};
