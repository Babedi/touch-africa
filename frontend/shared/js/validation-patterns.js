/**
 * Centralized Validation Patterns for TouchAfrica Frontend
 * Ensures consistent validation across all frontend components
 */

import { SHARED_VALIDATION_MESSAGES } from "./validation-messages.js";

// Centralized validation regex patterns
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SA_PHONE_REGEX = /^(\+27|27|0)[0-9]{9}$/;
export const SA_MOBILE_REGEX = /^(\+27|27|0)[6-8][0-9]{8}$/;
export const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const SA_ID_NUMBER_REGEX = /^\d{13}$/;
export const POSTAL_CODE_REGEX = /^\d{4}$/;
export const PASSWORD_LOWERCASE_REGEX = /(?=.*[a-z])/;
export const PASSWORD_UPPERCASE_REGEX = /(?=.*[A-Z])/;
export const PASSWORD_DIGIT_REGEX = /(?=.*\d)/;
export const PASSWORD_SPECIAL_REGEX = /(?=.*[@$!%*?&])/;
export const ROLE_CODE_REGEX = /^[A-Z_]+$/;

// Validation messages - using shared constants for consistency
export const VALIDATION_MESSAGES = {
  EMAIL: SHARED_VALIDATION_MESSAGES.EMAIL,
  SA_PHONE: SHARED_VALIDATION_MESSAGES.SA_PHONE,
  SA_MOBILE: SHARED_VALIDATION_MESSAGES.SA_MOBILE,
};

// Validation functions for frontend use
export const ValidationHelpers = {
  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {boolean} - True if valid
   */
  isValidEmail: (email) => {
    return EMAIL_REGEX.test(email);
  },

  /**
   * Validate South African phone number
   * @param {string} phone - Phone number to validate
   * @returns {boolean} - True if valid
   */
  isValidSAPhone: (phone) => {
    return SA_PHONE_REGEX.test(phone);
  },

  /**
   * Validate South African mobile number
   * @param {string} mobile - Mobile number to validate
   * @returns {boolean} - True if valid
   */
  isValidSAMobile: (mobile) => {
    return SA_MOBILE_REGEX.test(mobile);
  },

  /**
   * Normalize South African phone number to +27 format
   * @param {string} phone - Phone number to normalize
   * @returns {string} - Normalized phone number
   */
  normalizeSAPhone: (phone) => {
    if (!phone) return phone;

    const cleaned = phone.replace(/\s+/g, "");

    // Already in +27 format
    if (cleaned.startsWith("+27")) {
      return cleaned;
    }

    // 27 format without +
    if (cleaned.startsWith("27") && cleaned.length === 11) {
      return "+" + cleaned;
    }

    // 0 format (national)
    if (cleaned.startsWith("0") && cleaned.length === 10) {
      return "+27" + cleaned.substring(1);
    }

    return phone; // Return as-is if not recognized
  },

  /**
   * Validate role code format
   * @param {string} roleCode - Role code to validate
   * @returns {boolean} - True if valid
   */
  isValidRoleCode: (roleCode) => {
    return ROLE_CODE_REGEX.test(roleCode);
  },
};

// Make available globally for non-module scripts
if (typeof window !== "undefined") {
  window.TouchAfrica = window.TouchAfrica || {};
  window.TouchAfrica.ValidationPatterns = {
    EMAIL_REGEX,
    SA_PHONE_REGEX,
    SA_MOBILE_REGEX,
    ROLE_CODE_REGEX,
    VALIDATION_MESSAGES,
    ValidationHelpers,
  };
}
