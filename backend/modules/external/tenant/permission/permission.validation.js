import { z } from "zod";

/**
 * Schema for creating external permission with enhanced error messages
 */
export const ExternalPermissionSchema = z.object({
  module: z
    .string({
      required_error: "Module name is required",
      invalid_type_error: "Module name must be text",
    })
    .min(1, "Module name cannot be empty")
    .max(50, "Module name cannot exceed 50 characters")
    .regex(/^[a-zA-Z][a-zA-Z0-9._-]*$/, {
      message:
        "Module name must start with a letter and contain only letters, numbers, dots, underscores, or hyphens (e.g., 'user', 'tenant.admin')",
    }),
  permissions: z
    .array(
      z
        .string({
          invalid_type_error: "Each permission must be text",
        })
        .min(1, "Permission cannot be empty"),
      {
        required_error: "Permissions array is required",
        invalid_type_error: "Permissions must be an array",
      }
    )
    .min(
      1,
      "At least one permission is required for the module to be functional"
    )
    .max(50, "Cannot define more than 50 permissions for a single module")
    .refine(
      (permissions) => {
        const unique = new Set(permissions);
        return unique.size === permissions.length;
      },
      {
        message:
          "Permissions must be unique - duplicate permissions are not allowed",
      }
    ),
  permissionCode: z
    .string({
      required_error: "Permission code is required",
      invalid_type_error: "Permission code must be text",
    })
    .min(
      2,
      "Permission code must be at least 2 characters (e.g., 'CREATE_USER')"
    )
    .max(100, "Permission code cannot exceed 100 characters")
    .regex(/^[A-Z][A-Z0-9_.]*$/, {
      message:
        "Permission code must start with uppercase letter and contain only uppercase letters, numbers, dots, or underscores (e.g., 'CREATE_USER', 'MANAGE_ROLES')",
    }),
  permissionName: z
    .string({
      required_error: "Permission name is required",
      invalid_type_error: "Permission name must be text",
    })
    .min(
      3,
      "Permission name must be at least 3 characters (e.g., 'Create User')"
    )
    .max(100, "Permission name cannot exceed 100 characters")
    .refine((val) => val.trim().length >= 3, {
      message: "Permission name cannot consist only of spaces",
    }),
  description: z
    .string({
      invalid_type_error: "Description must be text",
    })
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  isActive: z
    .boolean({
      invalid_type_error: "Active status must be true or false",
    })
    .default(true),
});

/**
 * Schema for updating external permission (partial)
 */
export const ExternalPermissionUpdateSchema =
  ExternalPermissionSchema.partial();

/**
 * Generate new external permission ID
 */
export const newExternalPermissionId = () => {
  return `EPERMISSION${Date.now()}`;
};

/**
 * Validate permission ID format
 */
export const isValidExternalPermissionId = (id) => {
  return typeof id === "string" && id.startsWith("PERMISSION");
};
