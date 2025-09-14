/**
 * Modal Validation Helper Module
 * Provides easy integration of centralized validation patterns for modal files
 *
 * Usage:
 * import { createValidationRules, ValidationHelper } from '../../../shared/js/modal-validation-helper.js';
 *
 * const RULES = createValidationRules({
 *   email: 'required',
 *   phone: 'required',
 *   optionalPhone: 'optional'
 * });
 */

import {
  EMAIL_REGEX,
  SA_PHONE_REGEX,
  SA_MOBILE_REGEX,
  DATE_FORMAT_REGEX,
  SA_ID_NUMBER_REGEX,
  POSTAL_CODE_REGEX,
  PASSWORD_LOWERCASE_REGEX,
  PASSWORD_UPPERCASE_REGEX,
  PASSWORD_DIGIT_REGEX,
  PASSWORD_SPECIAL_REGEX,
  VALIDATION_MESSAGES,
  ValidationHelpers,
} from "./validation-patterns.js";

import { SHARED_VALIDATION_MESSAGES } from "./validation-messages.js";

/**
 * Pre-configured validation rules for common field types
 */
export const FIELD_VALIDATORS = {
  // Personal Information
  firstName: {
    required: true,
    validate: (v) =>
      v.trim().length > 0 || SHARED_VALIDATION_MESSAGES.FIRST_NAME_REQUIRED,
  },

  surname: {
    required: true,
    validate: (v) =>
      v.trim().length > 0 || SHARED_VALIDATION_MESSAGES.SURNAME_REQUIRED,
  },

  dateOfBirth: {
    required: true,
    validate: (v) => {
      if (!DATE_FORMAT_REGEX.test(v))
        return SHARED_VALIDATION_MESSAGES.DATE_OF_BIRTH_FORMAT;
      const [yy, mm, dd] = v.split("-").map(Number);
      const dob = new Date(yy, mm - 1, dd);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (dob > today) return SHARED_VALIDATION_MESSAGES.DATE_OF_BIRTH_FUTURE;
      const age = Math.floor((today - dob) / (365.25 * 24 * 60 * 60 * 1000));
      if (age > 150)
        return SHARED_VALIDATION_MESSAGES.DATE_OF_BIRTH_UNREALISTIC;
      return true;
    },
  },

  // Contact Information
  email: {
    required: true,
    validate: (v) => {
      if (!v) return "Email is required";
      return ValidationHelpers.isValidEmail(v) || VALIDATION_MESSAGES.EMAIL;
    },
  },

  emailOptional: {
    required: false,
    validate: (v) => {
      if (!v) return true;
      return ValidationHelpers.isValidEmail(v) || VALIDATION_MESSAGES.EMAIL;
    },
  },

  phone: {
    required: true,
    validate: (v) => {
      if (!v) return "Phone number is required";
      return (
        ValidationHelpers.isValidSAPhone(v) || VALIDATION_MESSAGES.SA_PHONE
      );
    },
  },

  phoneOptional: {
    required: false,
    validate: (v) => {
      if (!v) return true;
      return (
        ValidationHelpers.isValidSAPhone(v) || VALIDATION_MESSAGES.SA_PHONE
      );
    },
  },

  mobile: {
    required: true,
    validate: (v) => {
      if (!v) return "Mobile number is required";
      return (
        ValidationHelpers.isValidSAMobile(v) || VALIDATION_MESSAGES.SA_MOBILE
      );
    },
  },

  mobileOptional: {
    required: false,
    validate: (v) => {
      if (!v) return true;
      return (
        ValidationHelpers.isValidSAMobile(v) || VALIDATION_MESSAGES.SA_MOBILE
      );
    },
  },

  // Password validation
  password: {
    required: true,
    validate: (v) => {
      if (!v) return "Password is required";
      if (v.length < 8) return "Password must be at least 8 characters long";
      if (!PASSWORD_LOWERCASE_REGEX.test(v))
        return "Password must contain at least one lowercase letter";
      if (!PASSWORD_UPPERCASE_REGEX.test(v))
        return "Password must contain at least one uppercase letter";
      if (!PASSWORD_DIGIT_REGEX.test(v))
        return "Password must contain at least one number";
      if (!PASSWORD_SPECIAL_REGEX.test(v))
        return "Password must contain at least one special character (@$!%*?&)";
      return true;
    },
  },

  passwordOptional: {
    required: false,
    validate: (v) => {
      if (!v) return true;
      if (v.length < 8) return "Password must be at least 8 characters long";
      if (!PASSWORD_LOWERCASE_REGEX.test(v))
        return "Password must contain at least one lowercase letter";
      if (!PASSWORD_UPPERCASE_REGEX.test(v))
        return "Password must contain at least one uppercase letter";
      if (!PASSWORD_DIGIT_REGEX.test(v))
        return "Password must contain at least one number";
      if (!PASSWORD_SPECIAL_REGEX.test(v))
        return "Password must contain at least one special character (@$!%*?&)";
      return true;
    },
  },

  // South African ID Number
  saIdNumber: {
    required: true,
    validate: (v) => {
      if (!v) return "ID number is required";
      if (!SA_ID_NUMBER_REGEX.test(v))
        return SHARED_VALIDATION_MESSAGES.SA_ID_NUMBER;

      // Luhn check for SA ID
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        let d = Number(v[i]);
        if (i % 2 === 1) {
          d *= 2;
          if (d > 9) d -= 9;
        }
        sum += d;
      }
      const calc = (10 - (sum % 10)) % 10;
      return (
        calc === Number(v[12]) || SHARED_VALIDATION_MESSAGES.SA_ID_INVALID_CHECK
      );
    },
  },

  // Address fields
  addressLine: {
    required: true,
    validate: (v) =>
      v.trim().length > 0 || SHARED_VALIDATION_MESSAGES.ADDRESS_LINE_REQUIRED,
  },

  addressLineOptional: {
    required: false,
    validate: (v) =>
      !v || v.trim().length > 0 || "Address line cannot be empty if provided",
  },

  city: {
    required: true,
    validate: (v) =>
      v.trim().length > 0 || SHARED_VALIDATION_MESSAGES.CITY_REQUIRED,
  },

  province: {
    required: true,
    validate: (v) => {
      const saProvinces = [
        "Eastern Cape",
        "Free State",
        "Gauteng",
        "KwaZulu-Natal",
        "Limpopo",
        "Mpumalanga",
        "Northern Cape",
        "North West",
        "Western Cape",
      ];
      return (
        saProvinces.includes(v) || SHARED_VALIDATION_MESSAGES.PROVINCE_REQUIRED
      );
    },
  },

  postalCode: {
    required: true,
    validate: (v) => {
      if (!v) return SHARED_VALIDATION_MESSAGES.POSTAL_CODE_REQUIRED;
      return (
        POSTAL_CODE_REGEX.test(v) ||
        SHARED_VALIDATION_MESSAGES.POSTAL_CODE_FORMAT
      );
    },
  },

  // Demographics and selections
  gender: {
    required: true,
    validate: (v) => {
      if (!v) return SHARED_VALIDATION_MESSAGES.GENDER_REQUIRED;
      const validGenders = ["Male", "Female", "Other", "Prefer not to say"];
      return (
        validGenders.includes(v) || SHARED_VALIDATION_MESSAGES.GENDER_REQUIRED
      );
    },
  },

  race: {
    required: true,
    validate: (v) => {
      if (!v)
        return "Race must be one of: Black African, Coloured, Indian/Asian, White, Other, Prefer not to say";
      const validRaces = [
        "Black African",
        "Coloured",
        "Indian/Asian",
        "White",
        "Other",
        "Prefer not to say",
      ];
      return (
        validRaces.includes(v) ||
        "Race must be one of: Black African, Coloured, Indian/Asian, White, Other, Prefer not to say"
      );
    },
  },

  maritalStatus: {
    required: true,
    validate: (v) => {
      if (!v)
        return "Marital status must be one of: Single, Married, Divorced, Widowed, Separated, Customary Union, Life Partner, Unknown";
      const validStatuses = [
        "Single",
        "Married",
        "Divorced",
        "Widowed",
        "Separated",
        "Customary Union",
        "Life Partner",
        "Unknown",
      ];
      return (
        validStatuses.includes(v) ||
        "Marital status must be one of: Single, Married, Divorced, Widowed, Separated, Customary Union, Life Partner, Unknown"
      );
    },
  },

  employmentStatus: {
    required: true,
    validate: (v) => {
      if (!v)
        return "Employment status must be one of: Employed, Self-employed, Unemployed, Student, Retired, Other";
      const validStatuses = [
        "Employed",
        "Self-employed",
        "Unemployed",
        "Student",
        "Retired",
        "Other",
      ];
      return (
        validStatuses.includes(v) ||
        "Employment status must be one of: Employed, Self-employed, Unemployed, Student, Retired, Other"
      );
    },
  },

  educationLevel: {
    required: true,
    validate: (v) => {
      if (!v) return "Education level is required and cannot be empty";
      const validLevels = [
        "No formal education",
        "Primary school",
        "Secondary school",
        "Matric/Grade 12",
        "Certificate/Diploma",
        "Bachelor's degree",
        "Honours degree",
        "Master's degree",
        "Doctoral degree",
      ];
      return (
        validLevels.includes(v) ||
        "Education level is required and cannot be empty"
      );
    },
  },

  processingBasis: {
    required: true,
    validate: (v) => {
      if (!v)
        return "Processing basis must be one of: consent, contract, legal_obligation, legitimate_interest, vital_interest, public_task, other";
      const validBases = [
        "consent",
        "contract",
        "legal_obligation",
        "legitimate_interest",
        "vital_interest",
        "public_task",
        "other",
      ];
      return (
        validBases.includes(v) ||
        "Processing basis must be one of: consent, contract, legal_obligation, legitimate_interest, vital_interest, public_task, other"
      );
    },
  },

  // POPIA consent
  popiaConsent: {
    required: true,
    validate: (v) =>
      v === true || "Consent to process personal information is required",
  },

  // Generic required text field
  requiredText: {
    required: true,
    validate: (v) =>
      v.trim().length > 0 || "This field is required and cannot be empty",
  },
};

/**
 * Helper function to create validation rules from field configuration
 * @param {Object} fieldConfig - Configuration object mapping field names to validator types
 * @returns {Object} - Validation rules object
 *
 * Example:
 * const RULES = createValidationRules({
 *   contact_email: 'email',
 *   contact_mobile: 'mobile',
 *   contact_home: 'phoneOptional',
 *   firstName: 'firstName',
 *   idNumber: 'saIdNumber'
 * });
 */
export function createValidationRules(fieldConfig) {
  const rules = {};

  for (const [fieldName, validatorType] of Object.entries(fieldConfig)) {
    if (FIELD_VALIDATORS[validatorType]) {
      rules[fieldName] = { ...FIELD_VALIDATORS[validatorType] };
    } else {
      console.warn(
        `Unknown validator type: ${validatorType} for field: ${fieldName}`
      );
      rules[fieldName] = {
        required: false,
        validate: () => true,
      };
    }
  }

  return rules;
}

/**
 * Validation helper class for modal integration
 */
export class ValidationHelper {
  /**
   * Validate email using centralized pattern
   * @param {string} email
   * @returns {boolean|string}
   */
  static validateEmail(email, required = true) {
    if (!email) {
      return required ? "Email is required" : true;
    }
    return ValidationHelpers.isValidEmail(email) || VALIDATION_MESSAGES.EMAIL;
  }

  /**
   * Validate South African phone number using centralized pattern
   * @param {string} phone
   * @returns {boolean|string}
   */
  static validatePhone(phone, required = true) {
    if (!phone) {
      return required ? "Phone number is required" : true;
    }
    return (
      ValidationHelpers.isValidSAPhone(phone) || VALIDATION_MESSAGES.SA_PHONE
    );
  }

  /**
   * Validate South African mobile number using centralized pattern
   * @param {string} mobile
   * @returns {boolean|string}
   */
  static validateMobile(mobile, required = true) {
    if (!mobile) {
      return required ? "Mobile number is required" : true;
    }
    return (
      ValidationHelpers.isValidSAMobile(mobile) || VALIDATION_MESSAGES.SA_MOBILE
    );
  }

  /**
   * Get the centralized validation patterns for direct use
   * @returns {Object}
   */
  static getPatterns() {
    return {
      EMAIL_REGEX,
      SA_PHONE_REGEX,
      SA_MOBILE_REGEX,
      VALIDATION_MESSAGES,
    };
  }

  /**
   * Get standardized field validators for common use cases
   * @returns {object} Object containing pre-configured field validators
   */
  static getFieldValidators() {
    return FIELD_VALIDATORS;
  }

  /**
   * Create a validation function for email with optional domain restrictions
   * @param {string} requiredDomain - Optional domain requirement (e.g., "@touchafrica.co.za")
   * @returns {function} Validation function
   */
  static createEmailValidator(requiredDomain = null) {
    return (value) => {
      if (!value) return "Email is required";

      // Use centralized email validation
      const emailValidation = FIELD_VALIDATORS.email.validate(value);
      if (emailValidation !== true) return emailValidation;

      // Check domain requirement if specified
      if (
        requiredDomain &&
        !value.toLowerCase().endsWith(requiredDomain.toLowerCase())
      ) {
        return `Email must end with ${requiredDomain}`;
      }

      return true;
    };
  }

  /**
   * Create a validation function for phone numbers
   * @param {boolean} required - Whether the field is required
   * @returns {function} Validation function
   */
  static createPhoneValidator(required = true) {
    if (required) {
      return FIELD_VALIDATORS.phone.validate;
    } else {
      return FIELD_VALIDATORS.phoneOptional.validate;
    }
  }

  /**
   * Normalize South African phone number
   * @param {string} phone
   * @returns {string}
   */
  static normalizePhone(phone) {
    return ValidationHelpers.normalizeSAPhone(phone);
  }
}

// Export commonly used patterns for backward compatibility
export {
  EMAIL_REGEX,
  SA_PHONE_REGEX,
  SA_MOBILE_REGEX,
  VALIDATION_MESSAGES,
  ValidationHelpers,
};
