import { z } from "zod";

// Lookup Schema for creation
export const LookupSchema = z.object({
  category: z.string().min(3).max(50).trim(),
  subCategory: z.string().min(3).max(50).trim(),
  items: z.array(z.string().trim()).min(1).max(25),
  description: z.string().min(3).max(200).trim(),
});

// Lookup Update Schema (partial for updates)
export const LookupUpdateSchema = LookupSchema.partial();

// Generate new lookup ID
export function newLookupId() {
  return `LOOKUP${Date.now()}`;
}

// Validate lookup ID format
export function isValidLookupId(id) {
  return typeof id === "string" && /^LOOKUP\d+$/.test(id);
}
