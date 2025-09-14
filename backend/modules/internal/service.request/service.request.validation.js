import { z } from "zod";
import {
  EMAIL_REGEX,
  SA_PHONE_REGEX,
  VALIDATION_MESSAGES,
} from "../../../utilities/validation-patterns.js";

// Use centralized phone validation
const PhoneSchema = z
  .string()
  .regex(SA_PHONE_REGEX, VALIDATION_MESSAGES.SA_PHONE);

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
    phoneNumber: PhoneSchema,
    email: z.string().regex(EMAIL_REGEX, VALIDATION_MESSAGES.EMAIL),
  }),
  processing: z.object({ status: z.string() }).default({ status: "open" }),
});

export const ServiceRequestUpdateSchema = ServiceRequestSchema.partial();

export function newServiceRequestId() {
  return `SVCR${Date.now()}`;
}
