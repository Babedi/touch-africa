import { z } from "zod";

export const TenantUserPrivateRespondersSchema = z.object({
  title: z.string().min(2).max(20), // validated against lookups in controller/service
  names: z.string().min(3).max(50),
  surname: z.string().min(3).max(50),
  subAddress: z.object({
    streetOrFloor: z.string().min(3).max(50),
    unit: z.string().min(1).max(10),
  }),
  activationDetails: z.object({
    phoneNumber: z.string().regex(/^\+27\d{9}$/),
    pin: z.string().regex(/^\d{4}$/),
    preferredMenuLanguage: z.string().min(2).max(20), // validated from lookups
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

export const TenantUserPrivateRespondersUpdateSchema =
  TenantUserPrivateRespondersSchema.partial();

export function newTenantUserPrivateRespondersId() {
  return `PRVTR${Date.now()}`;
}
