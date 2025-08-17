import { z } from "zod";

const menuKeys = [
  "menuItem1",
  "menuItem2",
  "menuItem3",
  "menuItem4",
  "menuItem5",
];

export const TenantExternalResponderSchema = z.object({
  externalRespondersMenuItem1: z.array(z.string()).default([]),
  externalRespondersMenuItem2: z.array(z.string()).default([]),
  externalRespondersMenuItem3: z.array(z.string()).default([]),
  externalRespondersMenuItem4: z.array(z.string()).default([]),
  externalRespondersMenuItem5: z.array(z.string()).default([]),
});

export const TenantExternalResponderUpdateSchema =
  TenantExternalResponderSchema.partial();

export function newTenantExternalResponderId() {
  return `ERSPNDR${Date.now()}`;
}

export { menuKeys };
