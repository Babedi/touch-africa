import { z } from "zod";
import {
  EMAIL_REGEX,
  SA_PHONE_REGEX,
  VALIDATION_MESSAGES,
} from "../../../../utilities/validation-patterns.js";

/**
 * Person Validation Schema for South African Context
 * Comprehensive validation for person records including POPIA compliance
 */

// Phone number validation for South Africa
const PhoneSchema = z
  .string()
  .regex(SA_PHONE_REGEX, VALIDATION_MESSAGES.SA_PHONE);

// Contact information schema
const ContactSchema = z.object({
  mobile: PhoneSchema, // Required
  home: PhoneSchema.optional(),
  work: PhoneSchema.optional(),
  email: z.string().regex(EMAIL_REGEX, VALIDATION_MESSAGES.EMAIL), // Required
});

// Contact schema for updates (includes email as readonly/preserved field)
const ContactUpdateSchema = z.object({
  mobile: PhoneSchema, // Required for updates too
  home: PhoneSchema.optional(),
  work: PhoneSchema.optional(),
  email: z.string().regex(EMAIL_REGEX, VALIDATION_MESSAGES.EMAIL), // Required for updates too
});

// Address schema with required South African fields
const AddressSchema = z.object({
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().min(1, "Address line 2 is required"),
  unit: z.string().optional(),
  complex: z.string().optional(),
  streetNumber: z.string().optional(),
  streetName: z.string().min(1, "Street name is required"),
  suburb: z.string().min(1, "Suburb is required"),
  city: z.string().min(1, "City is required"),
  municipality: z.string().optional(),
  province: z.enum(
    [
      "Eastern Cape",
      "Free State",
      "Gauteng",
      "KwaZulu-Natal",
      "Limpopo",
      "Mpumalanga",
      "Northern Cape",
      "North West",
      "Western Cape",
    ],
    { required_error: "Valid South African province is required" }
  ),
  postalCode: z
    .string()
    .regex(/^\d{4}$/, "South African postal code must be 4 digits"),
  countryCode: z
    .string()
    .regex(/^[A-Z]{2}$/, "Country code must be 2 letter ISO code")
    .optional()
    .default("ZA"),
  geo: z
    .object({
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
    })
    .optional(),
});

// Addresses container
const AddressesSchema = z.object({
  residential: AddressSchema,
  postal: AddressSchema,
});

// Employer information
const EmployerSchema = z
  .object({
    name: z.string().optional(),
    employeeNumber: z.string().optional(),
  })
  .optional();

// Socio-economic information
const SocioEconomicSchema = z
  .object({
    taxNumber: z
      .string()
      .regex(/^\d{9,10}$/, "SARS tax number must be 9-10 digits")
      .optional(),
    uifNumber: z
      .string()
      .regex(/^\d{8,12}$/, "UIF number must be 8-12 digits")
      .optional(),
    medicalAidNumber: z
      .string()
      .regex(/^[A-Z0-9\-]{3,20}$/, "Medical aid number format invalid")
      .optional(),
    employmentStatus: z
      .enum([
        "Employed",
        "Unemployed",
        "Self-employed",
        "Student",
        "Retired",
        "Unknown",
      ])
      .optional(),
    employer: EmployerSchema,
  })
  .optional();

// Demographics
const DemographicsSchema = z.object({
  idNumber: z
    .string()
    .min(13, "South African ID number is required")
    .regex(/^\d{13}$/, "South African ID number must be 13 digits"), // Made required
  passportNumber: z.string().optional(),
  birthDate: z.string().optional(),
  dateOfBirth: z.string().date("Date of birth must be in YYYY-MM-DD format"),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"], {
    required_error: "Gender is required",
  }), // Already required
  citizenshipStatus: z
    .enum(["South African", "Permanent Resident", "Foreigner"])
    .optional(),
  nationality: z.string().min(1, "Nationality is required"), // Already required
  homeLanguage: z.string().min(1, "Home language is required"), // Already required
  race: z.enum(
    [
      "Black African",
      "Coloured",
      "Indian/Asian",
      "White",
      "Other",
      "Prefer not to say",
    ],
    {
      required_error: "Race is required",
    }
  ),
  maritalStatus: z.enum(
    [
      "Single",
      "Married",
      "Divorced",
      "Widowed",
      "Separated",
      "Customary Union",
      "Life Partner",
      "Unknown",
    ],
    {
      required_error: "Marital status is required",
    }
  ),
  dependentsCount: z.number().int().min(0).optional(),
  employment: z.object({
    status: z.enum(
      [
        "Employed",
        "Self-employed",
        "Unemployed",
        "Student",
        "Retired",
        "Other",
      ],
      {
        required_error: "Employment status is required",
      }
    ), // Required field
    company: z.string().min(1, "Company name is required"), // Required field
    position: z.string().min(1, "Position is required"), // Required field
    industry: z.string().min(1, "Industry is required"), // Required field
    monthlyIncome: z.string().min(1, "Monthly income is required"), // Required field
  }),
  education: z.object({
    level: z.enum(
      [
        "No formal education",
        "Primary school",
        "Secondary school",
        "Matric/Grade 12",
        "Certificate/Diploma",
        "Bachelor's degree",
        "Honours degree",
        "Master's degree",
        "Doctoral degree",
      ],
      {
        required_error: "Education level is required",
      }
    ), // Required field
    institution: z.string().min(1, "Institution is required"), // Required field
    fieldOfStudy: z.string().min(1, "Field of study is required"), // Required field
    graduationYear: z.string().min(1, "Graduation year is required"), // Required field
  }),
  disability: z.object({
    hasDisability: z.boolean({
      required_error: "Disability status is required",
    }),
    type: z.string().min(1, "Disability type is required"),
    assistanceRequired: z
      .string()
      .min(1, "Assistance required information is required"),
  }),
});

// Next of kin
const NextOfKinSchema = z.object({
  name: z.string().min(1, "Next of kin name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  phoneNumber: PhoneSchema,
  email: z.string().regex(EMAIL_REGEX, VALIDATION_MESSAGES.EMAIL).optional(),
  address: AddressSchema.optional(),
});

// POPIA compliance - requiring consent and processing basis
const PopiaSchema = z.object({
  consent: z.boolean().refine((val) => val === true, {
    message: "Consent to process personal information is required",
  }),
  consentTimestamp: z.string().datetime().optional(),
  processingBasis: z.enum(
    [
      "consent",
      "contract",
      "legal_obligation",
      "legitimate_interest",
      "vital_interest",
      "public_task",
      "other",
    ],
    {
      required_error: "Processing basis is required",
      invalid_type_error: "Please select a valid processing basis",
    }
  ),
  dataSubjectCategory: z
    .enum([
      "customer",
      "employee",
      "contractor",
      "student",
      "beneficiary",
      "other",
    ])
    .optional(),
});

// Audit information
const AuditSchema = z
  .object({
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    sourceSystem: z.string().optional(),
    recordVersion: z.number().int().min(1).optional(),
  })
  .optional();

// Base person schema
const BasePersonSchema = z.object({
  id: z.string().optional(), // Generated server-side

  // Personal details
  firstName: z.string().min(1, "First name is required"),
  middleNames: z.array(z.string().min(1)).optional(),
  surname: z.string().min(1, "Surname is required"),
  preferredName: z.string().min(1, "Preferred name is required"), // Required field

  // Complex nested objects
  contact: ContactSchema,
  addresses: AddressesSchema,
  socioEconomic: SocioEconomicSchema,
  demographics: DemographicsSchema,
  nextOfKin: NextOfKinSchema,
  popia: PopiaSchema,
  audit: AuditSchema,
});

// Main person schema with complex validation rules
export const PersonSchema = BasePersonSchema;

// Update schema - no fields are excluded as immutable (since idNumber moved to demographics)
export const PersonUpdateSchema = BasePersonSchema.extend({
  contact: ContactUpdateSchema, // Use contact schema with email preservation
}).partial();

/**
 * Generate new person ID
 * @returns {string} New person ID in format PERSON{timestamp}
 */
export function newPersonId() {
  return `PERSON${Date.now()}`;
}

/**
 * SA ID Validation simplified to format-only (13 digits)
 * Previous implementation with Luhn algorithm check digit validation
 * has been commented out per user requirements for simplified validation.
 *
 * OLD IMPLEMENTATION (Commented out):
 * Validate SA ID number check digit (Luhn algorithm)
 * @param {string} idNumber - 13 digit SA ID number
 * @returns {boolean} True if check digit is valid
 */
/*
export function validateSAIdCheckDigit(idNumber) {
  if (!idNumber || idNumber.length !== 13) {
    return false;
  }

  const digits = idNumber.split("").map((d) => parseInt(d));
  const checkDigit = digits[12];

  // Luhn algorithm for SA ID numbers
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    if (i % 2 === 0) {
      sum += digits[i];
    } else {
      const doubled = digits[i] * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    }
  }

  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  return calculatedCheckDigit === checkDigit;
}
*/

/**
 * Extract date of birth from SA ID number
 * @param {string} idNumber - 13 digit SA ID number
 * @returns {string|null} Date in YYYY-MM-DD format or null if invalid
 */
export function extractDateFromSAId(idNumber) {
  if (!idNumber || idNumber.length !== 13) {
    return null;
  }

  const year = parseInt(idNumber.substring(0, 2));
  const month = parseInt(idNumber.substring(2, 4));
  const day = parseInt(idNumber.substring(4, 6));

  // Determine century - use a more reasonable cutoff
  // Years 00-30 are 2000s, years 31-99 are 1900s
  const fullYear = year <= 30 ? 2000 + year : 1900 + year;

  // Validate date using UTC to avoid timezone issues
  const date = new Date(Date.UTC(fullYear, month - 1, day));
  if (
    date.getUTCFullYear() !== fullYear ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString().split("T")[0];
}

/**
 * Sanitize person data for response (remove sensitive fields)
 * @param {Object} person - Person object
 * @returns {Object} Sanitized person object
 */
export function sanitizePersonResponse(person) {
  if (!person) return null;

  // Remove sensitive fields but preserve ID numbers without masking
  const sanitized = { ...person };

  // ID numbers are now displayed without masking as requested
  // Keep idNumber as-is for display purposes

  // passportNumber removed

  // Remove system internal fields that shouldn't be exposed
  delete sanitized.audit?.sourceSystem;

  return sanitized;
}
