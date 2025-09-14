import { z } from "zod";

// Helper function to generate role IDs
export const newStandardRoleId = () => `SROLE${Date.now()}`;

// Permission validation schema with flexible module.action format
export const PermissionSchema = z
  .string()
  .regex(
    /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)*\.[a-zA-Z][a-zA-Z0-9]*$/,
    "Permission must follow module.action format (e.g., 'role.create', 'cultivarTemplate.read')"
  );

// Role schema
export const StandardRoleSchema = z.object({
  roleName: z
    .string()
    .min(3, "Role name must be at least 3 characters")
    .max(50, "Role name cannot exceed 50 characters"),
  roleCode: z
    .string()
    .min(2, "Role code must be at least 2 characters")
    .max(30, "Role code cannot exceed 30 characters")
    .regex(
      /^[A-Z_]+$/,
      "Role code must contain only uppercase letters and underscores"
    ),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(200, "Description cannot exceed 200 characters"),
  permissions: z
    .array(PermissionSchema)
    .min(1, "At least one permission must be selected"),
  isSystem: z.boolean().default(false),
  isActive: z.boolean().default(true),
  priority: z.number().int().min(0).max(100).default(50),
});

// Update schema (partial)
export const StandardRoleUpdateSchema = StandardRoleSchema.partial().omit({
  roleCode: true,
  isSystem: true,
});

// For PATCH/partial updates it's common to allow shorter description if provided; however
// the above ExternalRoleUpdateSchema already makes fields optional. The backend will accept
// provided description as long as it respects max length; preserving roleName/roleCode anyway.

// Check if valid role ID
export function isValidStandardRoleId(id) {
  // Allow standard SROLE format or special system role IDs
  return /^SROLE\d+$/.test(id) || /^STANDARD_[A-Z_]+$/.test(id);
}
