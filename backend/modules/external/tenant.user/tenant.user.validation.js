import { z } from "zod";
import { SA_PHONE_REGEX } from "../../../utilities/validation-patterns.js";

export const TenantUserSchema = z.object({
  title: z.string().min(2).max(20), // membership validated against lookups in service
  names: z.string().min(3).max(50),
  surname: z.string().min(3).max(50),
  subAddress: z.object({
    streetOrFloor: z.string().min(3).max(50),
    unit: z.string().min(1).max(10),
  }),
  activationDetails: z.object({
    phoneNumber: z
      .string()
      .regex(SA_PHONE_REGEX, "Please enter a valid South African phone number"),
    pin: z.string().regex(/^\d{4}$/),
    preferredMenuLanguage: z.string().min(2).max(20), // membership validated in service
    isATester: z.boolean().default(false),
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

export const TenantUserUpdateSchema = TenantUserSchema.partial();

export function newTenantUserId() {
  return `USER${Date.now()}`;
}
