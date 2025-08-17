import { z } from "zod";

// Helper function to generate server-side IDs
export const newInternalAdminId = () => `IADMIN${Date.now()}`;

// Base schema for internal admin
export const InternalAdminSchema = z.object({
  roles: z.array(z.string()).min(1).max(50),
  title: z.string().min(1).max(10),
  names: z.string().min(3).max(50),
  surname: z.string().min(3).max(50),
  accessDetails: z.object({
    email: z
      .string()
      .email()
      .refine((email) => email.endsWith("@neighbourguard.co.za"), {
        message: "Email must end with @neighbourguard.co.za",
      }),
    password: z.string().min(8), // Will be validated against Firestore regex pattern
    lastLogin: z.array(z.string().datetime()).default([]),
  }),
  account: z
    .object({
      isActive: z
        .object({
          value: z.boolean().default(true),
          changes: z.array(z.any()).default([]),
        })
        .default({
          value: true,
          changes: [],
        }),
    })
    .default({
      isActive: {
        value: true,
        changes: [],
      },
    }),
});

// Update schema (partial of creation schema)
export const InternalAdminUpdateSchema = InternalAdminSchema.partial();

// Login schema
export const InternalAdminLoginSchema = z.object({
  email: z
    .string()
    .email()
    .refine((email) => email.endsWith("@neighbourguard.co.za"), {
      message: "Email must end with @neighbourguard.co.za",
    }),
  password: z.string().min(1),
});
