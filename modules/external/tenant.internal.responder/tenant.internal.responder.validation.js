import { z } from "zod";

export const TenantInternalResponderSchema = z.object({
  internalRespondersMenuItem1: z.array(z.string()).default([]),
  internalRespondersMenuItem2: z.array(z.string()).default([]),
  internalRespondersMenuItem3: z.array(z.string()).default([]),
  internalRespondersMenuItem4: z.array(z.string()).default([]),
  internalRespondersMenuItem5: z.array(z.string()).default([]),
});

export const TenantInternalResponderUpdateSchema =
  TenantInternalResponderSchema.partial();

export function newTenantInternalResponderId() {
  return `IRSPNDR${Date.now()}`;
}
