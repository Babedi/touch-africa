import { z } from "zod";

// Helper function to generate role IDs
export const newExternalRoleId = () => `EROLE${Date.now()}`;

// Permission validation schema with flexible module.action format
export const PermissionSchema = z
  .string()
  .regex(
    /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)*\.[a-zA-Z][a-zA-Z0-9]*$/,
    {
      message:
        "Permission must follow module.action format (e.g., 'role.create', 'cultivarTemplate.read'). Use alphanumeric characters with dots separating module and action.",
    }
  );

// Role schema with enhanced error messages
export const ExternalRoleSchema = z.object({
  roleName: z
    .string({
      required_error: "Role name is required",
      invalid_type_error: "Role name must be text",
    })
    .min(3, "Role name must be at least 3 characters (e.g., 'Admin')")
    .max(50, "Role name cannot exceed 50 characters")
    .refine((val) => val.trim().length >= 3, {
      message: "Role name cannot consist only of spaces",
    }),
  roleCode: z
    .string({
      required_error: "Role code is required",
      invalid_type_error: "Role code must be text",
    })
    .min(2, "Role code must be at least 2 characters (e.g., 'ADMIN')")
    .max(30, "Role code cannot exceed 30 characters")
    .regex(/^[A-Z_]+$/, {
      message:
        "Role code must contain only uppercase letters and underscores (e.g., 'TENANT_ADMIN', 'USER_MANAGER')",
    }),
  description: z
    .string({
      required_error: "Description is required",
      invalid_type_error: "Description must be text",
    })
    .min(10, "Description must be at least 10 characters to be meaningful")
    .max(200, "Description cannot exceed 200 characters")
    .refine((val) => val.trim().length >= 10, {
      message: "Description cannot consist only of spaces",
    }),
  permissions: z
    .array(PermissionSchema, {
      required_error: "Permissions array is required",
      invalid_type_error: "Permissions must be an array",
    })
    .min(
      1,
      "At least one permission must be selected for the role to be functional"
    )
    .max(100, "Cannot assign more than 100 permissions to a single role"),
  isSystem: z
    .boolean({
      invalid_type_error: "System flag must be true or false",
    })
    .default(false),
  isActive: z
    .boolean({
      invalid_type_error: "Active status must be true or false",
    })
    .default(true),
  priority: z
    .number({
      required_error: "Priority is required",
      invalid_type_error: "Priority must be a number",
    })
    .int("Priority must be a whole number")
    .min(0, "Priority cannot be negative")
    .max(100, "Priority cannot exceed 100")
    .default(50),
});

// Update schema (partial)
export const ExternalRoleUpdateSchema = ExternalRoleSchema.partial().omit({
  roleCode: true,
  isSystem: true,
});

// For PATCH/partial updates it's common to allow shorter description if provided; however
// the above ExternalRoleUpdateSchema already makes fields optional. The backend will accept
// provided description as long as it respects max length; preserving roleName/roleCode anyway.

// Check if valid role ID
export function isValidExternalRoleId(id) {
  // Allow standard EROLE format or special system role IDs
  return /^EROLE\d+$/.test(id) || /^EXTERNAL_[A-Z_]+$/.test(id);
}
