import { z } from "zod";

// +27 followed by 9 digits
const phoneRegex = /^\+27\d{9}$/;
const idRegex = /^RSPNDR\d{10,}$/; // RSPNDR + epoch millis

export const TenantExternalResponderListSchema = z.object({
  type: z.string().min(3).max(50), // membership validated in service against lookups
  name: z.string().min(3).max(200),
  description: z.string().max(1000).optional().default(""),
  phoneNumber: z
    .string()
    .regex(phoneRegex, "phoneNumber must match +27000000000"),
  channel: z.string().min(2).max(50), // membership validated in service
  customMessage: z.string().max(200).optional().default(""),
});

export const TenantExternalResponderListUpdateSchema =
  TenantExternalResponderListSchema.partial();

export const ResponderIdSchema = z
  .string()
  .regex(idRegex, "id must be of format RSPNDR{timestamp}");

export function newTenantExternalResponderListId() {
  return `RSPNDR${Date.now()}`;
}
