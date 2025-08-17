import { z } from "zod";

// Shared primitives
const phoneRegex = /^\+27\d{9}$/; // +27 followed by 9 digits
const pinRegex = /^\d{4}$/; // 4 digits
const idRegex = /^ALARM\d{10,}$/; // ALARM + epoch millis or similar

export const TenantExternalAlarmListSchema = z.object({
  serialNumber: z.string().min(3).max(50),
  sgmModuleType: z.string().min(2).max(50), // membership validated in controller against lookups
  modelDescription: z.string().min(3).max(200),
  accessDetails: z.object({
    phoneNumber: z
      .string()
      .regex(phoneRegex, "phoneNumber must match +27000000000"),
    pin: z
      .union([z.string(), z.number()])
      .transform((v) => String(v))
      .refine((v) => pinRegex.test(v), {
        message: "pin must be 4 digits",
      }),
  }),
});

export const TenantExternalAlarmListUpdateSchema =
  TenantExternalAlarmListSchema.partial();

export const AlarmIdSchema = z
  .string()
  .regex(idRegex, "id must be of format ALARM{timestamp}");

export function newTenantExternalAlarmListId() {
  return `ALARM${Date.now()}`;
}
