import React from "react";

/**
 * Универсальная карточка статистики.
 * @param {string} title
 * @param {string} value
 * @param {React.ReactNode} icon
 * @param {string} trend - "+12% vs прошлый месяц"
 * @param {"red"|"green"|"default"} accent
 */
export default function StatCard({ title, value, icon, trend, accent = "default" }) {
  const accentColors = {
    red:     "border-[#D32F2F]/30 bg-[#D32F2F]/5",
    green:   "border-[#388E3C]/30 bg-[#388E3C]/5",
    default: "border-[#2A2A2A] bg-[#1A1A1A]",
  };

  const iconColors = {
    red:     "text-[#D32F2F]",
    green:   "text-[#388E3C]",
    default: "text-[#9E9E9E]",
  };

  return (
    <div className={`rounded-xl border p-4 ${accentColors[accent]}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-[#9E9E9E] uppercase tracking-wider">
          {title}
        </span>
        <span className={iconColors[accent]}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white leading-tight">{value}</p>
      {trend && (
        <p className="text-xs text-[#9E9E9E] mt-1">{trend}</p>
      )}
    </div>
  );
}