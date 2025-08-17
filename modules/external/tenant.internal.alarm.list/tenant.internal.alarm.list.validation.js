import { z } from "zod";

const phoneRegex = /^\+27\d{9}$/;
const pinRegex = /^\d{4}$/;
const idRegex = /^ALARM\d{10,}$/;

export const TenantInternalAlarmListSchema = z.object({
  serialNumber: z.string().min(3).max(50),
  sgmModuleType: z.string().min(2).max(50),
  modelDescription: z.string().min(3).max(200),
  accessDetails: z.object({
    phoneNumber: z.string().regex(phoneRegex),
    pin: z
      .union([z.string(), z.number()])
      .transform((v) => String(v))
      .refine((v) => pinRegex.test(v)),
  }),
});

export const TenantInternalAlarmListUpdateSchema =
  TenantInternalAlarmListSchema.partial();
export const AlarmIdSchema = z.string().regex(idRegex);
export function newTenantInternalAlarmListId() {
  return `ALARM${Date.now()}`;
}
