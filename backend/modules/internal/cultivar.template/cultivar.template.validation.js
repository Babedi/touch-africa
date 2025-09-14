import { z } from "zod";

// Schedule item schema
const ScheduleItemSchema = z.object({
  day: z.number().int().min(1),
  stage: z.string().min(1),
  activity: z.string().min(1),
  execution: z.string().min(1),
  resources: z.object({
    labour: z.string().min(1),
    equipment: z.array(z.string()),
    inputs: z.array(z.string()),
  }),
});

// Main CultivarTemplate schema
export const CultivarTemplateSchema = z.object({
  cultivar: z.string().min(1),
  category: z.string().min(1),
  subcategory: z.string().min(3).max(50),
  production_system: z.enum(["Tunnel"]),
  image_url: z.string().url(),
  growth_cycle_days: z.number().int().min(1),
  schedule: z.array(ScheduleItemSchema),
});

// Update schema (all fields optional)
export const CultivarTemplateUpdateSchema = CultivarTemplateSchema.partial();

// ID generator
export const newCultivarTemplateId = () => `TEMPLATE${Date.now()}`;

// Actor validation helper
export const validateActor = (req) => {
  return req.admin?.id || req.user?.id || req.user?.email || "system";
};
