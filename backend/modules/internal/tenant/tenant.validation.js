import { z } from "zod";
import {
  EMAIL_REGEX,
  SA_PHONE_REGEX,
  VALIDATION_MESSAGES,
} from "../../../utilities/validation-patterns.js";

export const TenantSchema = z.object({
  name: z.string().min(3).max(50),
  contact: z.object({
    phoneNumber: z.string().regex(SA_PHONE_REGEX, VALIDATION_MESSAGES.SA_PHONE),
    email: z.string().regex(EMAIL_REGEX, VALIDATION_MESSAGES.EMAIL),
  }),
  account: z
    .object({
      isActive: z.object({
        value: z.boolean().default(true),
        changes: z.array(z.any()).default([]),
      }),
    })
    .default({ isActive: { value: true, changes: [] } }),
});

export const TenantUpdateSchema = TenantSchema.partial().extend({
  contact: z
    .object({
      phoneNumber: z
        .string()
        .regex(SA_PHONE_REGEX, VALIDATION_MESSAGES.SA_PHONE)
        .optional(),
      email: z
        .string()
        .regex(EMAIL_REGEX, VALIDATION_MESSAGES.EMAIL)
        .optional(),
    })
    .optional(),
});

export function newTenantId() {
  return `TENANT${Date.now()}`;
}
