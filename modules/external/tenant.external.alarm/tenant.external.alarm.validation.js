import { z } from "zod";

// Valid menu keys for external alarms
export const externalAlarmMenuKeys = [
  "externalAlarmsMenuItem1",
  "externalAlarmsMenuItem2",
  "externalAlarmsMenuItem3",
  "externalAlarmsMenuItem4",
  "externalAlarmsMenuItem5",
];

export const ExternalAlarmMenuKeySchema = z.enum(externalAlarmMenuKeys);

// ID format for list items (alarms)
export const AlarmIdSchema = z
  .string()
  .regex(/^ALARM\d{10,}$/, "id must be of format ALARM{timestamp}");

// Bulk update schema accepts an array of alarm IDs
export const ExternalAlarmMenuUpdateSchema = z.object({
  alarmIds: z.array(AlarmIdSchema).default([]),
});

// Alternative schema where body is keyed by menu key for convenience
export const ExternalAlarmMenuKeyedUpdateSchema = z.object({
  externalAlarmsMenuItem1: z.array(AlarmIdSchema).optional(),
  externalAlarmsMenuItem2: z.array(AlarmIdSchema).optional(),
  externalAlarmsMenuItem3: z.array(AlarmIdSchema).optional(),
  externalAlarmsMenuItem4: z.array(AlarmIdSchema).optional(),
  externalAlarmsMenuItem5: z.array(AlarmIdSchema).optional(),
});
