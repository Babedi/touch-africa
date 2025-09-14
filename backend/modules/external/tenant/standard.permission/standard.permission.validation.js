import { z } from "zod";

/**
 * Schema for creating standard permission
 */
export const StandardPermissionSchema = z.object({
  module: z.string().min(1, "Module is required"),
  permissions: z
    .array(z.string())
    .min(1, "At least one permission is required"),
});

/**
 * Schema for updating standard permission (partial)
 */
export const StandardPermissionUpdateSchema =
  StandardPermissionSchema.partial();

/**
 * Generate new standard permission ID
 */
export const newStandardPermissionId = () => {
  return `STANDARD_PERMISSION${Date.now()}`;
};

/**
 * Validate standard permission ID format
 */
export const isValidStandardPermissionId = (id) => {
  return typeof id === "string" && id.startsWith("STANDARD_PERMISSION");
};
