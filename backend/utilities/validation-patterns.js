/**
 * Centralized validation patterns for TouchAfrica
 * Simple email and South African phone number regex patterns
 */

import { SHARED_VALIDATION_MESSAGES } from "../../shared/validation-messages.js";

// Simple email regex pattern
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// South African phone number regex patterns
// Accepts: +27123456789, 0123456789, 27123456789
export const SA_PHONE_REGEX = /^(\+27|27|0)[0-9]{9}$/;

// More specific SA mobile number regex (6-8 prefix for mobiles)
export const SA_MOBILE_REGEX = /^(\+27|27|0)[6-8][0-9]{8}$/;

// Email validation function
export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  return EMAIL_REGEX.test(email.trim());
}

// South African phone number validation function
export function isValidSAPhone(phone) {
  if (!phone || typeof phone !== "string") return false;
  return SA_PHONE_REGEX.test(phone.replace(/\s+/g, ""));
}

// South African mobile number validation function
export function isValidSAMobile(mobile) {
  if (!mobile || typeof mobile !== "string") return false;
  return SA_MOBILE_REGEX.test(mobile.replace(/\s+/g, ""));
}

// Normalize SA phone number to +27 format
export function normalizeSAPhone(phone) {
  if (!phone || typeof phone !== "string") return phone;

  const cleaned = phone.replace(/\s+/g, "");

  if (cleaned.startsWith("+27")) {
    return cleaned;
  } else if (cleaned.startsWith("27")) {
    return "+" + cleaned;
  } else if (cleaned.startsWith("0")) {
    return "+27" + cleaned.substring(1);
  } else {
    // Assume it's a SA number without prefix
    return "+27" + cleaned;
  }
}

// Validation error messages - using shared constants
export const VALIDATION_MESSAGES = {
  EMAIL: SHARED_VALIDATION_MESSAGES.EMAIL,
  SA_PHONE: SHARED_VALIDATION_MESSAGES.SA_PHONE,
  SA_MOBILE: SHARED_VALIDATION_MESSAGES.SA_MOBILE,
};
