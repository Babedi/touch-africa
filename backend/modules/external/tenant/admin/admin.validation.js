import { z } from "zod";
import {
  EMAIL_REGEX,
  VALIDATION_MESSAGES,
} from "../../../../utilities/validation-patterns.js";

// Helper function to generate server-side IDs
export const newExternalAdminId = () => `EADMIN${Date.now()}`;

// Base schema for External admin
export const ExternalAdminSchema = z.object({
  roles: z.array(z.string()).min(1).max(50),
  personId: z.string().regex(/^PERSON\d{13}$/, {
    message:
      'personId must start with "PERSON" followed by exactly 13 digits (e.g., PERSON1755684026728)',
  }),
  accessDetails: z.object({
    email: z
      .string()
      .regex(EMAIL_REGEX, VALIDATION_MESSAGES.EMAIL)
      .refine((email) => email.endsWith("@touchafrica.co.za"), {
        message: "Email must end with @touchafrica.co.za",
      }),
    password: z.string().min(8), // Will be validated against Firestore regex pattern
    lastLogin: z.array(z.any()).default([]), // Allow lastLogin array
  }),
  account: z
    .object({
      isActive: z
        .object({
          value: z.boolean().default(true),
          changes: z.array(z.any()).default([]),
        })
        .default({
          value: true,
          changes: [],
        }),
    })
    .default({
      isActive: {
        value: true,
        changes: [],
      },
    }),
});

// Update schema (partial of creation schema)
export const ExternalAdminUpdateSchema = ExternalAdminSchema.partial();

// Login schema
export const ExternalAdminLoginSchema = z.object({
  email: z
    .string()
    .regex(EMAIL_REGEX, VALIDATION_MESSAGES.EMAIL)
    .refine((email) => email.endsWith("@touchafrica.co.za"), {
      message: "Email must end with @touchafrica.co.za",
    }),
  password: z.string().min(1),
});
