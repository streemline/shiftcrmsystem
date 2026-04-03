import * as z from "zod";

export const workRecordSchema = z.object({
  date: z.string().min(1, "Дата обязательна"),
  day_type: z.enum(["Working", "Sick", "Day Off", "Vacation"]),
  object_type: z.string().nullable().optional(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  duration_hours: z.number().min(0),
  earnings: z.number().min(0),
  hourly_rate_snapshot: z.number().min(0),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.day_type === "Working") {
    return !!data.object_type && !!data.start_time && !!data.end_time;
  }
  return true;
}, {
  message: "Для рабочего дня объект, время начала и конца обязательны",
  path: ["object_type"], // указываем поле, к которому относится ошибка
});
