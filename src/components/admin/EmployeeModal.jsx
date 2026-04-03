import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  X, Pencil, Mail, Phone, MapPin, Award, TrendingUp
} from "lucide-react";

const TABS = [
  { id: "overview",  label: "Обзор" },
  { id: "worktime",  label: "Рабочее время" },
  { id: "salary",    label: "Зарплата" },
  { id: "bonuses",   label: "Премии" },
  { id: "absences",  label: "Отсутствия" },
  { id: "achievements", label: "Достижения" },
];

const ROLE_LABELS = {
  admin:    "Администратор",
  manager:  "Руководитель",
  employee: "Сотрудник",
};

const DAY_TYPE_LABELS = {
  "Working":  { label: "Рабочий день", color: "text-[#388E3C]", icon: "🗂" },
  "Sick":     { label: "Больничный",   color: "text-yellow-400", icon: "🤒" },
  "Day Off":  { label: "Выходной",     color: "text-[#9E9E9E]", icon: "☀️" },
  "Vacation": { label: "Отпуск",       color: "text-blue-400", icon: "🏖" },
};

const PRIORITY_COLORS = {
  high:   "bg-[#D32F2F] text-white",
  normal: "bg-[#F57C00] text-white",
  low:    "bg-[#388E3C] text-white",
};

const PRIORITY_LABELS = { high: "Высокий", normal: "Средний", low: "Низкий" };

function formatKc(amount) {
  if (!amount) return "0 Kč";
  return Math.round(amount).toLocaleString("cs") + " Kč";
}

function calcStreakDays(records) {
  const workingDates = records
    .filter(function(r) { return r.day_type === "Working"; })
    .map(function(r) { return r.date; })
    .sort()
    .reverse();

  if (workingDates.length === 0) return 0;

  let streak = 1;
  for (let i = 0; i < workingDates.length - 1; i++) {
    const d1 = new Date(workingDates[i]);
    const d2 = new Date(workingDates[i + 1]);
    const diff = (d1 - d2) / (1000 * 60 * 60 * 24);
    if (diff <= 3) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function calcLevel(totalHours) {
  if (totalHours >= 2000) return { level: 4, title: "Лидер", color: "#F57C00", icon: "👑" };
  if (totalHours >= 1000) return { level: 3, title: "Профи", color: "#9E9E9E", icon: "⭐" };
  if (totalHours >= 400)  return { level: 2, title: "Опытный", color: "#1976D2", icon: "🔷" };
  return { level: 1, title: "Новичок", color: "#388E3C", icon: "🌱" };
}

export default function EmployeeModal({ user, onClose, onEdit }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [workRecords, setWorkRecords] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(function() {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    setIsLoading(true);
    const [records, allTasks] = await Promise.all([
      base44.entities.WorkRecord.filter({ employee_id: user.email }, "-date", 500),
      base44.entities.Task.list("-created_date", 100),
    ]);
    setWorkRecords(records);
    setTasks(allTasks.filter(function(t) {
      return t.assigned_to && t.assigned_to.includes(user.email);
    }));
    setIsLoading(false);
  }

  if (!user) return null;

  // ---- Computed stats ----
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const currentMonthRecords = workRecords.filter(function(r) {
    return r.date && r.date.startsWith(currentYearMonth);
  });

  const totalHoursAllTime = workRecords.reduce(function(s, r) { return s + (r.duration_hours || 0); }, 0);
  const totalHoursMonth   = currentMonthRecords.reduce(function(s, r) { return s + (r.duration_hours || 0); }, 0);
  const totalEarningsMonth = currentMonthRecords.reduce(function(s, r) { return s + (r.earnings || 0); }, 0);
  const totalEarningsAll   = workRecords.reduce(function(s, r) { return s + (r.earnings || 0); }, 0);
  const workingDaysMonth   = currentMonthRecords.filter(function(r) { return r.day_type === "Working"; }).length;

  const absenceDays = workRecords.filter(function(r) {
    return r.day_type === "Sick" || r.day_type === "Vacation";
  });

  const streakDays = calcStreakDays(workRecords);
  const levelInfo  = calcLevel(totalHoursAllTime);

  const activeTasks    = tasks.filter(function(t) { return t.status !== "completed"; });
  const completedTasks = tasks.filter(function(t) { return t.status === "completed"; });

  // Monthly salary by month (last 6)
  const monthlySalaryMap = {};
  for (const r of workRecords) {
    if (!r.date) continue;
    const ym = r.date.substring(0, 7);
    monthlySalaryMap[ym] = (monthlySalaryMap[ym] || 0) + (r.earnings || 0);
  }
  const sortedMonths = Object.keys(monthlySalaryMap).sort().reverse().slice(0, 6);

  const MONTH_NAMES = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-[#2A2A2A] flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-[#D32F2F]/20 border border-[#D32F2F]/30 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-[#D32F2F]">
              {user.full_name?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white">{user.full_name}</h2>
            <p className="text-sm text-[#9E9E9E]">
              {ROLE_LABELS[user.role] || user.role}
              {user.position ? ` · ${user.position}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={function() { onEdit(user); }}
                className="flex items-center gap-2 px-3 py-1.5 border border-[#2A2A2A] rounded-lg text-xs text-[#9E9E9E] hover:text-white hover:border-[#555] transition-all"
              >
                <Pencil size={13} />
                Редактировать
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[#9E9E9E] hover:text-white hover:bg-[#2A2A2A] rounded-lg transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 border-b border-[#2A2A2A] overflow-x-auto scrollbar-hide flex-shrink-0">
          {TABS.map(function(tab) {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={function() { setActiveTab(tab.id); }}
                className={`flex-shrink-0 px-3 pb-3 text-sm font-medium border-b-2 transition-all ${
                  isActive
                    ? "border-[#D32F2F] text-white"
                    : "border-transparent text-[#555] hover:text-[#9E9E9E]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#2A2A2A] border-t-[#D32F2F] rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* === ОБЗОР === */}
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Левая колонка */}
                  <div className="space-y-4">
                    {/* Контакты */}
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
                      <h3 className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-3">Контакты</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-[#9E9E9E]">
                          <Mail size={13} className="text-[#555]" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2 text-sm text-[#9E9E9E]">
                            <Phone size={13} className="text-[#555]" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        {user.address && (
                          <div className="flex items-center gap-2 text-sm text-[#9E9E9E]">
                            <MapPin size={13} className="text-[#555]" />
                            <span>{user.address}</span>
                          </div>
                        )}
                        {user.hourly_rate && (
                          <div className="flex items-center gap-2 text-sm text-[#9E9E9E]">
                            <TrendingUp size={13} className="text-[#388E3C]" />
                            <span className="text-[#388E3C] font-semibold">{user.hourly_rate} Kč/ч</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Банковские реквизиты */}
                    {(user.bank_account || user.bank_name) && (
                      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
                        <h3 className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-3">Банковские реквизиты</h3>
                        <div className="space-y-1.5">
                          {user.bank_account && (
                            <div className="flex justify-between text-sm">
                              <span className="text-[#555]">Счёт:</span>
                              <span className="text-white font-mono">{user.bank_account}</span>
                            </div>
                          )}
                          {user.bank_name && (
                            <div className="flex justify-between text-sm">
                              <span className="text-[#555]">Банк:</span>
                              <span className="text-white">{user.bank_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Геймификация */}
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
                      <h3 className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-3">Геймификация</h3>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ background: levelInfo.color + "20", border: `2px solid ${levelInfo.color}40` }}>
                          {levelInfo.icon}
                        </div>
                        <div>
                          <p className="text-base font-bold" style={{ color: levelInfo.color }}>{levelInfo.title}</p>
                          <p className="text-xs text-[#555]">Уровень {levelInfo.level} из 4</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#555]">Баллы:</span>
                          <span className="font-bold text-[#F57C00]">{Math.round(totalHoursAllTime * 14)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#555]">Непрерывных дней:</span>
                          <span className="font-bold text-white">{streakDays}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {workRecords.length >= 30 && (
                          <span className="text-xs bg-[#F57C00]/20 text-[#F57C00] px-2 py-0.5 rounded-full">🏆 Ветеран</span>
                        )}
                        {workingDaysMonth >= 20 && (
                          <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full">⭐ Топ-1</span>
                        )}
                        {streakDays >= 30 && (
                          <span className="text-xs bg-blue-400/20 text-blue-400 px-2 py-0.5 rounded-full">🔥 Streak 30+</span>
                        )}
                        {completedTasks.length >= 5 && (
                          <span className="text-xs bg-[#388E3C]/20 text-[#388E3C] px-2 py-0.5 rounded-full">✅ Задачи</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Правая колонка */}
                  <div className="space-y-4">
                    {/* KPI */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3">
                        <p className="text-xs text-[#555] mb-1">Часов за месяц</p>
                        <p className="text-xl font-bold text-white">{Math.round(totalHoursMonth * 10) / 10}</p>
                        <p className="text-xs text-[#388E3C] mt-0.5">
                          {workingDaysMonth >= 20 ? "100% нормы" : `${workingDaysMonth} дн.`}
                        </p>
                      </div>
                      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3">
                        <p className="text-xs text-[#555] mb-1">Зарплата</p>
                        <p className="text-xl font-bold text-white">{Math.round(totalEarningsMonth).toLocaleString("cs")}</p>
                        <p className="text-xs text-[#9E9E9E] mt-0.5">CZK</p>
                      </div>
                      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3">
                        <p className="text-xs text-[#555] mb-1">Премии</p>
                        <p className="text-xl font-bold text-white">{user.bonus_month ? Math.round(user.bonus_month).toLocaleString("cs") : "—"}</p>
                        <p className="text-xs text-[#9E9E9E] mt-0.5">CZK</p>
                      </div>
                      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3">
                        <p className="text-xs text-[#555] mb-1">Рабочих дней</p>
                        <p className="text-xl font-bold text-white">{workingDaysMonth}</p>
                        <p className="text-xs text-[#555] mt-0.5">из 22</p>
                      </div>
                    </div>

                    {/* Последние записи */}
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold text-[#555] uppercase tracking-wider">Последние записи</h3>
                        <button onClick={function() { setActiveTab("worktime"); }} className="text-xs text-[#D32F2F]">Смотреть все</button>
                      </div>
                      <div className="space-y-2">
                        {workRecords.slice(0, 4).map(function(r) {
                          const typeInfo = DAY_TYPE_LABELS[r.day_type] || DAY_TYPE_LABELS["Working"];
                          return (
                            <div key={r.id} className="flex items-center gap-3 py-1">
                              <span className="text-base">{typeInfo.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium ${typeInfo.color}`}>{typeInfo.label}</p>
                                <p className="text-xs text-[#555]">
                                  {r.date}
                                  {r.start_time ? ` · ${r.start_time} – ${r.end_time}` : ""}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                {r.duration_hours > 0 && (
                                  <p className="text-xs font-semibold text-white">{r.duration_hours} ч</p>
                                )}
                                {r.earnings > 0 && (
                                  <p className="text-xs text-[#9E9E9E]">{Math.round(r.earnings).toLocaleString("cs")} Kč</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {workRecords.length === 0 && (
                          <p className="text-xs text-[#555] text-center py-2">Нет записей</p>
                        )}
                      </div>
                    </div>

                    {/* Активные задачи */}
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold text-[#555] uppercase tracking-wider">Активные задачи</h3>
                        {activeTasks.length > 0 && (
                          <span className="text-xs bg-blue-400/20 text-blue-400 px-2 py-0.5 rounded-full">
                            {activeTasks.length} задач{activeTasks.length === 1 ? "а" : "и"}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {tasks.slice(0, 5).map(function(t) {
                          const isCompleted = t.status === "completed";
                          const prioColor = PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.normal;
                          const prioLabel = PRIORITY_LABELS[t.priority] || "Средний";
                          return (
                            <div key={t.id} className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${isCompleted ? "bg-[#388E3C]" : "border border-[#2A2A2A]"}`}>
                                {isCompleted && <span className="text-white text-xs">✓</span>}
                              </div>
                              <p className={`flex-1 text-xs ${isCompleted ? "line-through text-[#555]" : "text-white"}`}>{t.title}</p>
                              <span className={`text-xs px-1.5 py-0.5 rounded text-white flex-shrink-0 ${prioColor}`}>
                                {isCompleted ? "Готово" : prioLabel}
                              </span>
                            </div>
                          );
                        })}
                        {tasks.length === 0 && (
                          <p className="text-xs text-[#555] text-center py-2">Нет задач</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* === РАБОЧЕЕ ВРЕМЯ === */}
              {activeTab === "worktime" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-white">{Math.round(totalHoursAllTime * 10) / 10}</p>
                      <p className="text-xs text-[#555]">Всего часов</p>
                    </div>
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-white">{workRecords.filter(function(r) { return r.day_type === "Working"; }).length}</p>
                      <p className="text-xs text-[#555]">Рабочих дней</p>
                    </div>
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-white">{workRecords.length}</p>
                      <p className="text-xs text-[#555]">Всего записей</p>
                    </div>
                  </div>
                  {workRecords.slice(0, 30).map(function(r) {
                    const typeInfo = DAY_TYPE_LABELS[r.day_type] || DAY_TYPE_LABELS["Working"];
                    return (
                      <div key={r.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 flex items-center gap-3">
                        <div className="w-9 text-center flex-shrink-0">
                          <p className="text-sm font-bold text-white">{r.date?.split("-")[2]}</p>
                          <p className="text-xs text-[#555]">{r.date ? new Date(r.date + "T12:00:00").toLocaleDateString("ru", { month: "short" }) : ""}</p>
                        </div>
                        <div className="w-px h-8 bg-[#2A2A2A] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium ${typeInfo.color}`}>{typeInfo.label}</p>
                          {r.start_time && (
                            <p className="text-xs text-[#555]">{r.start_time} – {r.end_time}{r.object_type ? ` · ${r.object_type}` : ""}</p>
                          )}
                          {r.notes && <p className="text-xs text-[#555] mt-0.5 break-words">{r.notes}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {r.duration_hours > 0 && <p className="text-sm font-bold text-white">{r.duration_hours} ч</p>}
                          {r.earnings > 0 && <p className="text-xs text-[#388E3C]">{Math.round(r.earnings).toLocaleString("cs")} Kč</p>}
                        </div>
                      </div>
                    );
                  })}
                  {workRecords.length === 0 && <p className="text-sm text-[#555] text-center py-8">Нет записей</p>}
                </div>
              )}

              {/* === ЗАРПЛАТА === */}
              {activeTab === "salary" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div className="bg-[#1A1A1A] border border-[#388E3C]/30 rounded-xl p-4">
                      <p className="text-xs text-[#555] mb-1">За текущий месяц</p>
                      <p className="text-2xl font-bold text-[#388E3C]">{Math.round(totalEarningsMonth).toLocaleString("cs")}</p>
                      <p className="text-xs text-[#9E9E9E]">Kč</p>
                    </div>
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
                      <p className="text-xs text-[#555] mb-1">За всё время</p>
                      <p className="text-2xl font-bold text-white">{Math.round(totalEarningsAll).toLocaleString("cs")}</p>
                      <p className="text-xs text-[#9E9E9E]">Kč</p>
                    </div>
                  </div>
                  <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-3">По месяцам</h3>
                    <div className="space-y-2">
                      {sortedMonths.map(function(ym) {
                        const monthIdx = parseInt(ym.split("-")[1]) - 1;
                        const yearNum = ym.split("-")[0];
                        const amount = Math.round(monthlySalaryMap[ym] || 0);
                        const maxAmount = Math.max(...sortedMonths.map(function(m) { return monthlySalaryMap[m] || 0; }));
                        const pct = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
                        return (
                          <div key={ym} className="flex items-center gap-3">
                            <span className="text-xs text-[#555] w-16 flex-shrink-0">{MONTH_NAMES[monthIdx]} {yearNum}</span>
                            <div className="flex-1 h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                              <div className="h-full bg-[#388E3C] rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-white w-24 text-right flex-shrink-0">{amount.toLocaleString("cs")} Kč</span>
                          </div>
                        );
                      })}
                      {sortedMonths.length === 0 && <p className="text-xs text-[#555] text-center py-4">Нет данных</p>}
                    </div>
                  </div>
                  {user.hourly_rate && (
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#9E9E9E]">Почасовая ставка</span>
                        <span className="text-sm font-bold text-[#388E3C]">{user.hourly_rate} Kč/ч</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* === ПРЕМИИ === */}
              {activeTab === "bonuses" && (
                <div className="space-y-4">
                  <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 text-center">
                    <Award size={32} className="text-[#F57C00] mx-auto mb-3" />
                    <p className="text-sm text-[#9E9E9E]">Функция премий будет доступна в следующей версии.</p>
                    <p className="text-xs text-[#555] mt-1">Здесь будут отображаться разовые премии и надбавки.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#1A1A1A] border border-[#F57C00]/30 rounded-xl p-4 text-center">
                      <p className="text-xs text-[#555] mb-1">Этот месяц</p>
                      <p className="text-xl font-bold text-[#F57C00]">0</p>
                      <p className="text-xs text-[#9E9E9E]">Kč</p>
                    </div>
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 text-center">
                      <p className="text-xs text-[#555] mb-1">За год</p>
                      <p className="text-xl font-bold text-white">0</p>
                      <p className="text-xs text-[#9E9E9E]">Kč</p>
                    </div>
                  </div>
                </div>
              )}

              {/* === ОТСУТСТВИЯ === */}
              {activeTab === "absences" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-yellow-400">{workRecords.filter(function(r) { return r.day_type === "Sick"; }).length}</p>
                      <p className="text-xs text-[#555]">Больничных</p>
                    </div>
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-blue-400">{workRecords.filter(function(r) { return r.day_type === "Vacation"; }).length}</p>
                      <p className="text-xs text-[#555]">Дней отпуска</p>
                    </div>
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-[#9E9E9E]">{workRecords.filter(function(r) { return r.day_type === "Day Off"; }).length}</p>
                      <p className="text-xs text-[#555]">Выходных</p>
                    </div>
                  </div>
                  {absenceDays.length === 0 ? (
                    <p className="text-sm text-[#555] text-center py-8">Нет отсутствий</p>
                  ) : (
                    absenceDays.map(function(r) {
                      const typeInfo = DAY_TYPE_LABELS[r.day_type] || DAY_TYPE_LABELS["Working"];
                      return (
                        <div key={r.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 flex items-center gap-3">
                          <span className="text-xl">{typeInfo.icon}</span>
                          <div>
                            <p className={`text-sm font-medium ${typeInfo.color}`}>{typeInfo.label}</p>
                            <p className="text-xs text-[#555]">{r.date}</p>
                          </div>
                          {r.notes && <p className="text-xs text-[#555] ml-auto">{r.notes}</p>}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* === ДОСТИЖЕНИЯ === */}
              {activeTab === "achievements" && (
                <div className="space-y-3">
                  <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex items-center gap-4 mb-2">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl flex-shrink-0" style={{ background: levelInfo.color + "20", border: `2px solid ${levelInfo.color}40` }}>
                      {levelInfo.icon}
                    </div>
                    <div>
                      <p className="text-lg font-bold" style={{ color: levelInfo.color }}>{levelInfo.title}</p>
                      <p className="text-xs text-[#555]">Уровень {levelInfo.level} из 4 · {Math.round(totalHoursAllTime)} часов всего</p>
                    </div>
                  </div>
                  {[
                    { id: "veteran",  icon: "🏆", title: "Ветеран",       desc: "Более 30 записей в системе",        earned: workRecords.length >= 30 },
                    { id: "top1",     icon: "⭐", title: "Топ сотрудник", desc: "20+ рабочих дней за месяц",         earned: workingDaysMonth >= 20 },
                    { id: "streak30", icon: "🔥", title: "Streak 30+",    desc: "30 дней непрерывной работы",        earned: streakDays >= 30 },
                    { id: "tasks5",   icon: "✅", title: "Мастер задач",  desc: "Выполнено 5+ задач",                earned: completedTasks.length >= 5 },
                    { id: "hrs500",   icon: "⏱",  title: "500 часов",     desc: "Отработано более 500 часов",        earned: totalHoursAllTime >= 500 },
                    { id: "hrs1000",  icon: "💎", title: "1000 часов",    desc: "Отработано более 1000 часов",       earned: totalHoursAllTime >= 1000 },
                    { id: "tasks10",  icon: "🎯", title: "Профи задач",   desc: "Выполнено 10+ задач",               earned: completedTasks.length >= 10 },
                  ].map(function(ach) {
                    return (
                      <div key={ach.id} className={`flex items-center gap-3 rounded-xl p-4 border transition-all ${ach.earned ? "bg-[#1A1A1A] border-[#388E3C]/30" : "bg-[#111] border-[#2A2A2A] opacity-40"}`}>
                        <span className="text-2xl">{ach.icon}</span>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${ach.earned ? "text-white" : "text-[#555]"}`}>{ach.title}</p>
                          <p className="text-xs text-[#555]">{ach.desc}</p>
                        </div>
                        {ach.earned && <span className="text-xs text-[#388E3C] font-semibold">Получено</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}