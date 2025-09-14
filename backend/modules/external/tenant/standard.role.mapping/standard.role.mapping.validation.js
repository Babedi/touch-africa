import { z } from "zod";

/**
 * Schema for creating standard role mapping
 */
export const StandardRoleMappingSchema = z.object({
  roleName: z
    .string()
    .min(1, "Role name is required")
    .max(100, "Role name must be less than 100 characters")
    .regex(/^[a-zA-Z0-9_\-\s]+$/, "Role name contains invalid characters"),
  roleCode: z
    .string()
    .min(1, "Role code is required")
    .max(50, "Role code must be less than 50 characters")
    .regex(
      /^[A-Z0-9_]+$/,
      "Role code must be uppercase alphanumeric with underscores"
    ),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  isActive: z.boolean().default(true),
  priority: z.number().int().min(0).max(100).default(50),
});

/**
 * Schema for updating standard role mapping (partial)
 */
export const StandardRoleMappingUpdateSchema =
  StandardRoleMappingSchema.partial().omit({
    roleName: true, // Role name cannot be changed as it's the key
  });

/**
 * Generate new standard role mapping ID
 */
export const newStandardRoleMappingId = () => {
  return `STANDARD_ROLEMAPPING${Date.now()}`;
};

/**
 * Validate standard role mapping ID format
 */
export const isValidStandardRoleMappingId = (id) => {
  return typeof id === "string" && id.startsWith("STANDARD_ROLEMAPPING");
};

/**
 * Schema for bulk role mapping operations
 */
export const BulkRoleMappingSchema = z.object({
  mappings: z
    .array(StandardRoleMappingSchema)
    .min(1, "At least one mapping is required"),
  overwrite: z.boolean().default(false),
});

/**
 * Schema for role mapping search/filter
 */
export const RoleMappingFilterSchema = z.object({
  roleName: z.string().optional(),
  roleCode: z.string().optional(),
  isActive: z.boolean().optional(),
  priority: z.number().int().min(0).max(100).optional(),
});

/**
 * Validate role name format
 */
export const validateRoleName = (roleName) => {
  if (!roleName || typeof roleName !== "string") {
    throw new Error("Invalid role name");
  }
  if (roleName.length < 1 || roleName.length > 100) {
    throw new Error("Role name must be between 1 and 100 characters");
  }
  if (!/^[a-zA-Z0-9_\-\s]+$/.test(roleName)) {
    throw new Error("Role name contains invalid characters");
  }
  return roleName;
};

/**
 * Validate role code format
 */
export const validateRoleCode = (roleCode) => {
  if (!roleCode || typeof roleCode !== "string") {
    throw new Error("Invalid role code");
  }
  if (roleCode.length < 1 || roleCode.length > 50) {
    throw new Error("Role code must be between 1 and 50 characters");
  }
  if (!/^[A-Z0-9_]+$/.test(roleCode)) {
    throw new Error(
      "Role code must be uppercase alphanumeric with underscores"
    );
  }
  return roleCode;
};

/**
 * Helper function to validate role creation data
 */
export function validateRoleMappingCreation(data) {
  return RoleMappingSchema.parse(data);
}

/**
 * Helper function to validate role update data
 */
export function validateRoleMappingUpdate(data) {
  return StandardRoleMappingUpdateSchema.parse(data);
}

export default {
  StandardRoleMappingSchema,
  StandardRoleMappingUpdateSchema,
  BulkRoleMappingSchema,
  RoleMappingFilterSchema,
  newStandardRoleMappingId,
  isValidStandardRoleMappingId,
  validateRoleName,
  validateRoleCode,
  validateRoleMappingCreation,
  validateRoleMappingUpdate,
};
