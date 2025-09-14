import { z } from "zod";

export const ServiceInfoSchema = z.object({
  logo: z.string().min(1),
  name: z.string().min(1),
  version: z.string().regex(/^\d{2}\.\d{3}\.\d{4}$/),
  initialized: z.string().min(1),
  active: z.boolean().default(true),
  descriptions: z.array(z.string().min(25).max(200)).default([]),
  features: z
    .array(
      z.object({
        title: z.string().min(3).max(25),
        text: z.string().min(50).max(200),
      })
    )
    .default([]),
  emphasizes: z.array(z.string().min(25).max(200)).default([]),
  taglines: z.array(z.string().min(15).max(50)).default([]),
  communicationChannels: z.object({}).passthrough().default({}),
  social: z.object({}).passthrough().default({}),
});

export const ServiceInfoUpdateSchema = ServiceInfoSchema.partial();
