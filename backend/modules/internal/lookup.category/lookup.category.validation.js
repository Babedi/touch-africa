import { z } from "zod";

// LookupCategory Schema for creation
export const LookupCategorySchema = z.object({
  category: z.string().min(3).max(50).trim(),
  description: z.string().min(3).max(200).trim(),
});

// LookupCategory Update Schema (partial for updates)
export const LookupCategoryUpdateSchema = LookupCategorySchema.partial();

// Generate new lookup category ID
export function newLookupCategoryId() {
  return `LOOKUP_CATEGORY${Date.now()}`;
}

// Validate lookup category ID format
export function isValidLookupCategoryId(id) {
  return typeof id === "string" && /^LOOKUP_CATEGORY\d+$/.test(id);
}
