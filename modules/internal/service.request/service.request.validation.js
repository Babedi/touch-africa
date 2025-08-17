import { z } from "zod";

export const ServiceRequestSchema = z.object({
  title: z.string().min(2).max(50),
  names: z.string().min(3).max(50),
  surname: z.string().min(3).max(50),
  company: z.string().min(0).max(50).optional().default(""),
  role: z.string().min(0).max(50).optional().default(""),
  typeOfUser: z.string().min(3).max(50),
  messageRelationTo: z.string().min(3).max(50),
  message: z.string().min(3).max(200),
  contactInfo: z.object({
    phoneNumber: z.string().min(10).max(13),
    email: z.string().email(),
  }),
  processing: z.object({ status: z.string() }).default({ status: "open" }),
});

export const ServiceRequestUpdateSchema = ServiceRequestSchema.partial();

export function newServiceRequestId() {
  return `SVCR${Date.now()}`;
}
