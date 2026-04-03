import React from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid
} from "recharts";

const tooltipStyle = {
  contentStyle: {
    background: "#1A1A1A",
    border: "1px solid #2A2A2A",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "12px",
  },
  cursor: { fill: "#2A2A2A" },
};

export function DailyHoursChart({ data }) {
  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 mb-4">
      <h2 className="text-sm font-semibold text-white mb-3">Часы по дням</h2>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -22, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "#9E9E9E", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#9E9E9E", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} formatter={function(v) { return [`${v} ч`, "Часов"]; }} />
          <Bar dataKey="hours" radius={[3, 3, 0, 0]}>
            {data.map(function(entry, i) {
              return <Cell key={i} fill={entry.hours >= 10 ? "#D32F2F" : entry.hours >= 8 ? "#F57C00" : "#388E3C"} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-3 mt-2">
        <LegendDot color="#388E3C" label="< 8 ч" />
        <LegendDot color="#F57C00" label="8–10 ч" />
        <LegendDot color="#D32F2F" label="> 10 ч" />
      </div>
    </div>
  );
}

export function YearlyChart({ data }) {
  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 mb-4">
      <h2 className="text-sm font-semibold text-white mb-3">Часы по месяцам</h2>
      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#388E3C" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#388E3C" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: "#9E9E9E", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#9E9E9E", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} formatter={function(v) { return [`${v} ч`, "Часов"]; }} />
          <Area type="monotone" dataKey="hours" stroke="#388E3C" strokeWidth={2} fill="url(#hoursGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EarningsChart({ data }) {
  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 mb-4">
      <h2 className="text-sm font-semibold text-white mb-3">Заработок по месяцам</h2>
      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D32F2F" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#D32F2F" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: "#9E9E9E", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#9E9E9E", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} formatter={function(v) { return [`${Math.round(v).toLocaleString("cs")} Kč`, "Заработок"]; }} />
          <Area type="monotone" dataKey="earnings" stroke="#D32F2F" strokeWidth={2} fill="url(#earningsGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProductivityScore({ avgHours, workingDays, totalEarnings }) {
  const score = Math.min(100, Math.round((avgHours / 10) * 60 + (workingDays / 22) * 40));
  const color = score >= 80 ? "#388E3C" : score >= 50 ? "#F57C00" : "#D32F2F";
  const label = score >= 80 ? "Отлично" : score >= 50 ? "Хорошо" : "Низкий";

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 mb-4">
      <h2 className="text-sm font-semibold text-white mb-3">Индекс продуктивности</h2>
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="#2A2A2A" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15" fill="none"
              stroke={color} strokeWidth="3"
              strokeDasharray={`${(score / 100) * 94.2} 94.2`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white">{score}</span>
          </div>
        </div>
        <div>
          <p className="text-lg font-bold" style={{ color }}>{label}</p>
          <p className="text-xs text-[#9E9E9E]">Сред. {avgHours.toFixed(1)} ч/день</p>
          <p className="text-xs text-[#9E9E9E]">{workingDays} рабочих дней</p>
      <p className="text-xs text-[#388E3C]">{Math.round(totalEarnings).toLocaleString("cs")} Kč</p>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-1">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-[10px] text-[#9E9E9E]">{label}</span>
    </div>
  );
}