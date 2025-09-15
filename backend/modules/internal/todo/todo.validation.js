import { z } from "zod";

// Helper function to generate todo IDs
export const newTodoId = () => `TODO${Date.now()}`;

// Priority enum schema
export const PrioritySchema = z.enum(["low", "medium", "high"], {
  errorMap: () => ({ message: "Priority must be 'low', 'medium', or 'high'" }),
});

// Todo schema - all fields required
export const TodoSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters")
    .trim(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .trim()
    .optional()
    .default(""),
  priority: PrioritySchema,
  completed: z.boolean(),
  createdAt: z.date().or(z.string().transform((str) => new Date(str))),
  updatedAt: z.date().or(z.string().transform((str) => new Date(str))),
});

// Create schema (omit timestamps as they'll be set by server)
export const TodoCreateSchema = TodoSchema.omit({
  createdAt: true,
  updatedAt: true,
}).extend({
  completed: z.boolean().default(false),
});

// Update schema (partial, but completed status can be updated)
export const TodoUpdateSchema = TodoSchema.partial()
  .omit({
    createdAt: true,
  })
  .extend({
    updatedAt: z
      .date()
      .or(z.string().transform((str) => new Date(str)))
      .optional(),
  });

// Toggle completion schema
export const TodoToggleSchema = z.object({
  completed: z.boolean(),
});

// Filter/query schema
export const TodoFilterSchema = z.object({
  completed: z.boolean().optional(),
  priority: PrioritySchema.optional(),
  limit: z.number().int().min(1).max(100).default(50).optional(),
  offset: z.number().int().min(0).default(0).optional(),
  search: z.string().max(100).optional(),
});

// Check if valid todo ID
export const isValidTodoId = (id) => {
  return typeof id === "string" && id.startsWith("TODO") && id.length > 4;
};

// Validate todo ID
export const TodoIdSchema = z
  .string()
  .refine(isValidTodoId, "Invalid todo ID format");

// Export for use in other modules
export const schemas = {
  TodoSchema,
  TodoCreateSchema,
  TodoUpdateSchema,
  TodoToggleSchema,
  TodoFilterSchema,
  TodoIdSchema,
  PrioritySchema,
};
