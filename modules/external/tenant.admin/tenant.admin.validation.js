import { z } from "zod";

export const TenantAdminSchema = z.object({
  roles: z.array(z.string()).min(1).max(50),
  title: z.string().min(2).max(20),
  names: z.string().min(3).max(50),
  surname: z.string().min(3).max(50),
  accessDetails: z.object({
    email: z
      .string()
      .email()
      .refine((email) => email.endsWith("@neighbourguard.co.za"), {
        message: "Email must end with @neighbourguard.co.za",
      }),
    password: z
      .string()
      .min(8)
      .regex(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/), // fallback; ideally from Firestore formats
    lastLogin: z.array(z.any()).default([]),
  }),
  account: z.object({
    isActive: z.object({
      value: z.boolean().default(true),
      changes: z.array(z.any()).default([]),
    }),
  }),
});

export const TenantAdminUpdateSchema = TenantAdminSchema.partial();

export function newTenantAdminId() {
  // As per spec: IADMIN${Date.now()}
  return `IADMIN${Date.now()}`;
}
