import { z } from "zod";

// LookupSubCategory Schema for creation
export const LookupSubCategorySchema = z.object({
  subcategory: z.string().min(3).max(50).trim(),
  description: z.string().min(3).max(200).trim(),
});

// LookupSubCategory Update Schema (partial for updates)
export const LookupSubCategoryUpdateSchema = LookupSubCategorySchema.partial();

// Generate new lookup sub category ID
export function newLookupSubCategoryId() {
  return `LOOKUP_SUB_CATEGORY${Date.now()}`;
}

// Validate lookup sub category ID format
export function isValidLookupSubCategoryId(id) {
  return typeof id === "string" && /^LOOKUP_SUB_CATEGORY\d+$/.test(id);
}
