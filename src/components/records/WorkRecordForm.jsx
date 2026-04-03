import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { base44 } from "@/api/base44Client";
import { calculateDurationHours, calculateEarnings } from "../utils/timeUtils";
import { workRecordSchema } from "@/lib/validation";
import { toast } from "sonner";

const DEFAULT_OBJECT_TYPES = ["Производство", "Монтаж", "Демонтаж", "Другое"];
const DAY_TYPES = [
  { value: "Working",  label: "Рабочий" },
  { value: "Sick",     label: "Больничный" },
  { value: "Day Off",  label: "Выходной" },
  { value: "Vacation", label: "Отпуск" },
];

export default function WorkRecordForm({ initialData, hourlyRate, onSave, onCancel }) {
  const today = new Date().toISOString().split("T")[0];
  const [objectTypes, setObjectTypes] = useState(DEFAULT_OBJECT_TYPES);

  useEffect(function() {
    base44.entities.ObjectType.filter({ is_active: true }, "sort_order", 100)
      .then(function(types) {
        if (types && types.length > 0) {
          setObjectTypes(types.map(function(t) { return t.name; }));
        }
      })
      .catch(function() {});
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(workRecordSchema),
    defaultValues: initialData || {
      date: today,
      day_type: "Working",
      start_time: "08:00",
      end_time: "17:00",
      notes: "",
    },
  });

  const dayType = watch("day_type");
  const startTime = watch("start_time");
  const endTime = watch("end_time");
  const isWorkingDay = dayType === "Working";

  const rawDurationHours = isWorkingDay ? calculateDurationHours(startTime, endTime) : 0;
  // Мы могли бы хранить состояние "дороги" в форме, но пока используем watch/setValue
  const [isDoroga, setIsDoroga] = useState(false);
  const durationHours = isDoroga ? Math.round((rawDurationHours / 2) * 100) / 100 : rawDurationHours;
  const earnings = isWorkingDay ? calculateEarnings(durationHours, hourlyRate || 0) : 0;

  async function onSubmit(data) {
    const recordData = {
      ...data,
      object_type: isWorkingDay ? data.object_type : null,
      start_time: isWorkingDay ? data.start_time : null,
      end_time: isWorkingDay ? data.end_time : null,
      duration_hours: durationHours,
      earnings: earnings,
      hourly_rate_snapshot: hourlyRate || 0,
    };
    await onSave(recordData);
  }

  return (
    <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-5">
      <h2 className="text-lg font-semibold text-white mb-5">
        {initialData ? "Редактировать запись" : "Новая запись"}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#9E9E9E] mb-1.5 uppercase tracking-wider">Дата</label>
          <input type="date" {...register("date")} className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors" />
          {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-[#9E9E9E] mb-1.5 uppercase tracking-wider">Тип дня</label>
          <div className="grid grid-cols-2 gap-2">
            {DAY_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setValue("day_type", type.value)}
                className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-all ${
                  dayType === type.value
                    ? "bg-[#D32F2F] border-[#D32F2F] text-white"
                    : "bg-[#0A0A0A] border-[#2A2A2A] text-[#9E9E9E]"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {isWorkingDay && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#9E9E9E] mb-1.5 uppercase tracking-wider">Начало</label>
                <input type="time" {...register("start_time")} className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9E9E9E] mb-1.5 uppercase tracking-wider">Конец</label>
                <input type="time" {...register("end_time")} className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9E9E9E] mb-2 uppercase tracking-wider">Объект</label>
              <div className="grid grid-cols-2 gap-2">
                {objectTypes.map((type) => (
                  <label key={type} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer ${watch("object_type") === type ? "border-[#D32F2F] bg-[#D32F2F]/10" : "border-[#2A2A2A] bg-[#0A0A0A]"}`}>
                    <input type="radio" value={type} {...register("object_type")} className="accent-[#D32F2F]" />
                    <span className="text-sm text-white">{type}</span>
                  </label>
                ))}
              </div>
              {errors.object_type && <p className="text-xs text-red-500 mt-1">{errors.object_type.message}</p>}
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-sm text-[#9E9E9E]">
              <input type="checkbox" checked={isDoroga} onChange={(e) => setIsDoroga(e.target.checked)} className="accent-[#F57C00]" />
              Дорога (расчет времени ÷ 2)
            </label>
          </>
        )}

        <div>
          <label className="block text-xs font-medium text-[#9E9E9E] mb-1.5 uppercase tracking-wider">Заметки</label>
          <textarea {...register("notes")} rows={3} className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F]" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-[#2A2A2A] text-[#9E9E9E] text-sm font-medium hover:border-[#555]">Отмена</button>
          <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-lg bg-[#D32F2F] text-white text-sm font-semibold hover:bg-[#B71C1C] disabled:opacity-50">
            {isSubmitting ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </form>
    </div>
  );
}