import { z } from "zod";

export const internalAlarmMenuKeys = [
  "internalAlarmsMenuItem1",
  "internalAlarmsMenuItem2",
  "internalAlarmsMenuItem3",
  "internalAlarmsMenuItem4",
  "internalAlarmsMenuItem5",
];

export const InternalAlarmMenuKeySchema = z.enum(internalAlarmMenuKeys);

export const AlarmIdSchema = z
  .string()
  .regex(/^ALARM\d{10,}$/, "id must be of format ALARM{timestamp}");

export const InternalAlarmMenuUpdateSchema = z.object({
  alarmIds: z.array(AlarmIdSchema).default([]),
});

export const InternalAlarmMenuKeyedUpdateSchema = z.object({
  internalAlarmsMenuItem1: z.array(AlarmIdSchema).optional(),
  internalAlarmsMenuItem2: z.array(AlarmIdSchema).optional(),
  internalAlarmsMenuItem3: z.array(AlarmIdSchema).optional(),
  internalAlarmsMenuItem4: z.array(AlarmIdSchema).optional(),
  internalAlarmsMenuItem5: z.array(AlarmIdSchema).optional(),
});
