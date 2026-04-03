import React from "react";
import { formatHours } from "../utils/timeUtils";
import { Pencil, Trash2, Clock, Briefcase } from "lucide-react";

const DAY_TYPE_LABELS = {
  "Working":  { label: "Рабочий",    color: "text-[#388E3C] bg-[#388E3C]/10" },
  "Sick":     { label: "Больничный", color: "text-yellow-400 bg-yellow-400/10" },
  "Day Off":  { label: "Выходной",   color: "text-[#9E9E9E] bg-[#9E9E9E]/10" },
  "Vacation": { label: "Отпуск",     color: "text-blue-400 bg-blue-400/10" },
};

/**
 * Одна строка записи рабочего времени.
 * @param {object} record
 * @param {function} onEdit
 * @param {function} onDelete
 */
export default function WorkRecordItem({ record, onEdit, onDelete }) {
  const typeInfo = DAY_TYPE_LABELS[record.day_type] || DAY_TYPE_LABELS["Working"];
  const isWorkingDay = record.day_type === "Working";

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3">
      <div className="flex items-start gap-3">
        {/* Дата */}
        <div className="flex-shrink-0 text-center w-10">
          <p className="text-base font-bold text-white leading-none">
            {record.date ? record.date.split("-")[2] : "--"}
          </p>
          <p className="text-xs text-[#9E9E9E] mt-0.5">
            {record.date ? new Date(record.date + "T12:00:00").toLocaleDateString("ru", { month: "short" }) : ""}
          </p>
        </div>

        {/* Разделитель */}
        <div className="w-px h-8 bg-[#2A2A2A] flex-shrink-0 mt-1" />

        {/* Основная информация */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
            {isWorkingDay && record.object_type && (
              <span className="text-xs text-[#9E9E9E] flex items-center gap-0.5">
                <Briefcase size={10} />
                {record.object_type}
              </span>
            )}
          </div>

          {isWorkingDay && record.start_time && record.end_time ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#9E9E9E] flex items-center gap-1">
                <Clock size={10} />
                {record.start_time}–{record.end_time}
              </span>
              <span className="text-xs font-semibold text-white">
                {formatHours(record.duration_hours)}
              </span>
              {record.earnings != null && (
                <span className="text-xs font-bold text-[#388E3C]">
                  {Math.round(record.earnings).toLocaleString("cs")} Kč
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#9E9E9E]">Нет рабочих часов</p>
          )}

          {record.notes && (
            <p className="text-xs text-[#555] mt-0.5 break-words whitespace-normal">{record.notes}</p>
          )}
        </div>

        {/* Кнопки действий */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={function() { onEdit(record); }}
            className="p-1.5 text-[#9E9E9E] hover:text-white hover:bg-[#2A2A2A] rounded-lg transition-all"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={function() { onDelete(record); }}
            className="p-1.5 text-[#9E9E9E] hover:text-[#D32F2F] hover:bg-[#D32F2F]/10 rounded-lg transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}