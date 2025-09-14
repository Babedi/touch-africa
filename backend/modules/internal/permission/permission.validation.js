import { z } from "zod";

/**
 * Schema for creating internal permission
 */
export const InternalPermissionSchema = z.object({
  module: z.string().min(1, "Module is required"),
  permissions: z
    .array(z.string())
    .min(1, "At least one permission is required"),
});

/**
 * Schema for updating internal permission (partial)
 */
export const InternalPermissionUpdateSchema =
  InternalPermissionSchema.partial();

/**
 * Generate new internal permission ID
 */
export const newInternalPermissionId = () => {
  return `IPERMISSION${Date.now()}`;
};

/**
 * Validate permission ID format
 */
export const isValidInternalPermissionId = (id) => {
  return typeof id === "string" && id.startsWith("PERMISSION");
};
