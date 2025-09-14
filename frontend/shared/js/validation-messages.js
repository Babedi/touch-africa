/**
 * Shared Validation Messages
 * Centralized validation error messages used by both frontend and backend
 * This ensures consistency across the entire application
 */

export const SHARED_VALIDATION_MESSAGES = {
  // Contact Information
  EMAIL: "Please enter a valid email address (e.g., user@example.com)",
  SA_PHONE:
    "Please enter a valid South African phone number (+27xxxxxxxxx or 0xxxxxxxxx)",
  SA_MOBILE:
    "Please enter a valid South African mobile number (+27xxxxxxxxx or 0xxxxxxxxx)",

  // Identity Information
  SA_ID_NUMBER: "SA ID number must be exactly 13 digits (e.g., 8001015009087)",
  SA_ID_INVALID_CHECK: "SA ID number has invalid check digit",

  // Personal Information
  FIRST_NAME_REQUIRED: "First name is required and cannot be empty",
  SURNAME_REQUIRED: "Surname is required and cannot be empty",
  DATE_OF_BIRTH_FORMAT:
    "Date of birth must be in YYYY-MM-DD format (e.g., 1980-01-15)",
  DATE_OF_BIRTH_FUTURE: "Date of birth cannot be in the future",
  DATE_OF_BIRTH_UNREALISTIC: "Age seems unrealistic (over 150 years)",

  // Address Information
  ADDRESS_LINE_REQUIRED: "Address line is required and cannot be empty",
  CITY_REQUIRED: "City is required and cannot be empty",
  PROVINCE_REQUIRED:
    "Province must be one of the 9 SA provinces (e.g., Gauteng, Western Cape)",
  POSTAL_CODE_FORMAT: "Postal code must be exactly 4 digits (e.g., 2000)",
  POSTAL_CODE_REQUIRED: "Postal code is required",

  // Demographics
  GENDER_REQUIRED:
    "Gender must be one of: Male, Female, Other, Prefer not to say",
  RACE_REQUIRED:
    "Race must be one of: Black African, Coloured, Indian/Asian, White, Other, Prefer not to say",
  MARITAL_STATUS_REQUIRED:
    "Marital status must be one of: Single, Married, Divorced, Widowed, Separated, Customary Union, Life Partner, Unknown",
  EMPLOYMENT_STATUS_REQUIRED:
    "Employment status must be one of: Employed, Self-employed, Unemployed, Student, Retired, Other",

  // Role and Permission Management
  ROLE_CODE_REQUIRED: "Role code is required",
  ROLE_CODE_FORMAT: "Role code must be alphanumeric (e.g., ADMIN_USER)",
  ROLE_NAME_REQUIRED: "Role name is required and cannot be empty",
  PERMISSION_CODE_REQUIRED: "Permission code is required",
  PERMISSION_CODE_FORMAT:
    "Permission code must be alphanumeric (e.g., CREATE_USER)",
  PERMISSION_NAME_REQUIRED: "Permission name is required and cannot be empty",
  DESCRIPTION_REQUIRED: "Description is required and cannot be empty",

  // Status Fields
  STATUS_INVALID:
    "Status must be one of the allowed values (e.g., active, inactive, pending)",
  IS_ACTIVE_INVALID: "Active status must be true or false",
  IS_ENABLED_INVALID: "Enabled status must be true or false",

  // Date Fields
  CREATED_AT_INVALID: "Created date must be in valid date format",
  UPDATED_AT_INVALID: "Updated date must be in valid date format",
  START_DATE_INVALID: "Start date must be in YYYY-MM-DD format",
  END_DATE_INVALID: "End date must be in YYYY-MM-DD format",

  // Socio-economic Information
  TAX_NUMBER_FORMAT: "SARS tax number must be 9-10 digits",
  UIF_NUMBER_FORMAT: "UIF number must be 8-12 digits",
  MEDICAL_AID_INVALID: "Medical aid number format is invalid",

  // Work Information
  WORK_PHONE_FORMAT:
    "Work number must be in SA format: +27xxxxxxxxx or 0xxxxxxxxx",

  // General Required Fields
  FIELD_REQUIRED: "This field is required",
  FIELD_CANNOT_BE_EMPTY: "This field cannot be empty",
};

/**
 * Validation message categories for easier organization
 */
export const VALIDATION_CATEGORIES = {
  CONTACT: ["EMAIL", "SA_PHONE", "SA_MOBILE", "WORK_PHONE_FORMAT"],
  IDENTITY: ["SA_ID_NUMBER", "SA_ID_INVALID_CHECK"],
  PERSONAL: [
    "FIRST_NAME_REQUIRED",
    "SURNAME_REQUIRED",
    "DATE_OF_BIRTH_FORMAT",
    "DATE_OF_BIRTH_FUTURE",
    "DATE_OF_BIRTH_UNREALISTIC",
  ],
  ADDRESS: [
    "ADDRESS_LINE_REQUIRED",
    "CITY_REQUIRED",
    "PROVINCE_REQUIRED",
    "POSTAL_CODE_FORMAT",
    "POSTAL_CODE_REQUIRED",
  ],
  DEMOGRAPHICS: [
    "GENDER_REQUIRED",
    "RACE_REQUIRED",
    "MARITAL_STATUS_REQUIRED",
    "EMPLOYMENT_STATUS_REQUIRED",
  ],
  ROLE_PERMISSION: [
    "ROLE_CODE_REQUIRED",
    "ROLE_CODE_FORMAT",
    "ROLE_NAME_REQUIRED",
    "PERMISSION_CODE_REQUIRED",
    "PERMISSION_CODE_FORMAT",
    "PERMISSION_NAME_REQUIRED",
    "DESCRIPTION_REQUIRED",
  ],
  STATUS: ["STATUS_INVALID", "IS_ACTIVE_INVALID", "IS_ENABLED_INVALID"],
  DATES: [
    "CREATED_AT_INVALID",
    "UPDATED_AT_INVALID",
    "START_DATE_INVALID",
    "END_DATE_INVALID",
  ],
  SOCIOECONOMIC: [
    "TAX_NUMBER_FORMAT",
    "UIF_NUMBER_FORMAT",
    "MEDICAL_AID_INVALID",
  ],
  GENERAL: ["FIELD_REQUIRED", "FIELD_CANNOT_BE_EMPTY"],
};

/**
 * Helper function to get validation message by key
 */
export function getValidationMessage(key) {
  return (
    SHARED_VALIDATION_MESSAGES[key] || SHARED_VALIDATION_MESSAGES.FIELD_REQUIRED
  );
}

/**
 * Helper function to get all messages for a category
 */
export function getValidationMessagesByCategory(category) {
  const messageKeys = VALIDATION_CATEGORIES[category] || [];
  return messageKeys.reduce((messages, key) => {
    messages[key] = SHARED_VALIDATION_MESSAGES[key];
    return messages;
  }, {});
}
