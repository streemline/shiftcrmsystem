import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Clock, DollarSign, Calendar, Plus, ArrowRight, TrendingUp } from "lucide-react";
import StatCard from "../components/shared/StatCard";
import ActiveShiftWidget from "../components/gps/ActiveShiftWidget";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { formatCurrency, formatHours, getMonthName, getYearMonth } from "../components/utils/timeUtils";
import { useTranslation } from "@/lib/i18n";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell
} from "recharts";

export default function Dashboard() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [currentMonthRecords, setCurrentMonthRecords] = useState([]);
  const [prevMonthRecords, setPrevMonthRecords] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(function() {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);

    const currentUser = await base44.auth.me();
    setUser(currentUser);

    const now = new Date();
    const currentYearMonth = getYearMonth(now);

    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevYearMonth = getYearMonth(prevDate);

    var isAdmin = currentUser.role === "admin" || currentUser.role === "manager";
    var allRecords;
    if (isAdmin) {
      allRecords = await base44.entities.WorkRecord.list("-date", 500);
    } else {
      allRecords = await base44.entities.WorkRecord.filter(
        { employee_id: currentUser.email },
        "-date",
        200
      );
    }

    const current = allRecords.filter(function(r) {
      return r.date && r.date.startsWith(currentYearMonth);
    });

    const prev = allRecords.filter(function(r) {
      return r.date && r.date.startsWith(prevYearMonth);
    });

    setCurrentMonthRecords(current);
    setPrevMonthRecords(prev);
    setRecentRecords(allRecords.slice(0, 5));
    setAllRecords(allRecords);
    setIsLoading(false);
  }

  function sumHours(records) {
    return records.reduce(function(sum, r) {
      return sum + (r.duration_hours || 0);
    }, 0);
  }

  function sumEarnings(records) {
    return records.reduce(function(sum, r) {
      return sum + (r.earnings || 0);
    }, 0);
  }

  function countWorkingDays(records) {
    return records.filter(function(r) { return r.day_type === "Working"; }).length;
  }

  function calcTrend(current, prev) {
    if (prev === 0) return null;
    const diff = ((current - prev) / prev) * 100;
    const sign = diff >= 0 ? "+" : "";
    return `${sign}${diff.toFixed(0)}% vs прошлый месяц`;
  }

  const currentHours = sumHours(currentMonthRecords);
  const prevHours = sumHours(prevMonthRecords);
  const currentEarnings = sumEarnings(currentMonthRecords);
  const prevEarnings = sumEarnings(prevMonthRecords);
  const workingDays = countWorkingDays(currentMonthRecords);

  const now = new Date();
  const monthTitle = `${getMonthName(now.getMonth())} ${now.getFullYear()}`;

  // --- Диаграмма 1: часы по объектам (текущий месяц) ---
  function buildProjectHoursData(records) {
    var byProject = {};
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var key = r.object_type || "Другое";
      if (!byProject[key]) byProject[key] = 0;
      byProject[key] += r.duration_hours || 0;
    }
    var result = [];
    var keys = Object.keys(byProject);
    for (var j = 0; j < keys.length; j++) {
      result.push({ name: keys[j], hours: Math.round(byProject[keys[j]] * 10) / 10 });
    }
    return result;
  }

  // --- Диаграмма 2: доход за последние 3 месяца ---
  function buildIncomeChartData(records) {
    var months = [];
    for (var i = 2; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var ym = getYearMonth(d);
      var earnings = 0;
      for (var j = 0; j < records.length; j++) {
        if (records[j].date && records[j].date.startsWith(ym)) {
          earnings += records[j].earnings || 0;
        }
      }
      months.push({ month: getMonthName(d.getMonth()).substring(0, 3), earnings: Math.round(earnings) });
    }
    return months;
  }

  var projectHoursData = buildProjectHoursData(currentMonthRecords);
  var incomeData = buildIncomeChartData(allRecords);

  var CHART_COLORS = ["#D32F2F", "#388E3C", "#F57C00", "#1565C0", "#6A1B9A"];

  var tooltipStyle = {
    contentStyle: { background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: "8px", color: "#fff", fontSize: "12px" },
    cursor: { fill: "#2A2A2A" },
  };

  const DAY_TYPE_LABELS = {
    "Working":  t("working"),
    "Sick":     t("sick"),
    "Day Off":  t("day_off"),
    "Vacation": t("vacation"),
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSpinner text={t("loading")} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-2xl mx-auto">
      {/* Приветствие */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">
          {t("hello")}, {user?.full_name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-[#9E9E9E] mt-0.5">{monthTitle}</p>
      </div>

      {/* KPI карточки */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          title={t("hours")}
          value={formatHours(currentHours)}
          icon={<Clock size={16} />}
          trend={calcTrend(currentHours, prevHours)}
          accent="red"
        />
        <StatCard
          title={t("earnings")}
          value={formatCurrency(currentEarnings)}
          icon={<DollarSign size={16} />}
          trend={calcTrend(currentEarnings, prevEarnings)}
          accent="green"
        />
        <StatCard
          title={t("working_days")}
          value={`${workingDays} дн.`}
          icon={<Calendar size={16} />}
          accent="default"
        />
        <StatCard
          title={t("rate")}
          value={user?.hourly_rate ? `${user.hourly_rate} Kč/ч` : "—"}
          icon={<TrendingUp size={16} />}
          accent="default"
        />
      </div>

      {/* Диаграмма: часы по объектам */}
      {projectHoursData.length > 0 && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 mb-5">
          <p className="text-sm font-semibold text-white mb-3">Часы по проектам — {monthTitle}</p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={projectHoursData} margin={{ top: 0, right: 0, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#9E9E9E", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9E9E9E", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={function(v) { return [`${v} ч`, "Часов"]; }} />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                {projectHoursData.map(function(_, i) {
                  return <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Диаграмма: доход за 3 месяца */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 mb-5">
        <p className="text-sm font-semibold text-white mb-3">Динамика дохода (3 месяца)</p>
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={incomeData} margin={{ top: 4, right: 0, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#388E3C" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#388E3C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "#9E9E9E", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#9E9E9E", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} formatter={function(v) { return [`${v.toLocaleString("cs")} Kč`, "Доход"]; }} />
            <Area type="monotone" dataKey="earnings" stroke="#388E3C" strokeWidth={2} fill="url(#incomeGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Быстрые действия */}
      <ActiveShiftWidget user={user} onRecordChange={loadData} />

      <Link
        to={createPageUrl("Records")}
        className="flex items-center justify-between w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3.5 mb-6 group hover:border-[#555] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#2A2A2A] rounded-lg flex items-center justify-center group-hover:bg-[#333] transition-colors">
            <Plus size={18} className="text-[#9E9E9E] group-hover:text-white transition-colors" />
          </div>
          <span className="text-[#9E9E9E] group-hover:text-white font-medium text-sm transition-colors">{t("add_record")}</span>
        </div>
        <ArrowRight size={18} className="text-[#555] group-hover:translate-x-1 group-hover:text-white transition-all" />
      </Link>

      {/* Последние записи */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">{t("recent_records")}</h2>
          <Link
            to={createPageUrl("Records")}
            className="text-xs text-[#D32F2F] hover:text-[#B71C1C] flex items-center gap-1"
          >
            Все <ArrowRight size={12} />
          </Link>
        </div>

        {recentRecords.length === 0 ? (
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 text-center">
            <p className="text-[#9E9E9E] text-sm">{t("no_data")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentRecords.map(function(record) {
              const isWorkingDay = record.day_type === "Working";
              return (
                <div
                  key={record.id}
                  className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 flex items-center gap-3"
                >
                  <div className="text-center w-10 flex-shrink-0">
                    <p className="text-base font-bold text-white leading-none">
                      {record.date?.split("-")[2]}
                    </p>
                    <p className="text-[10px] text-[#9E9E9E]">
                      {record.date ? new Date(record.date + "T12:00:00").toLocaleDateString("ru", { month: "short" }) : ""}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white">
                      {DAY_TYPE_LABELS[record.day_type] || record.day_type}
                      {record.object_type ? ` · ${record.object_type}` : ""}
                    </p>
                    {isWorkingDay && record.start_time && (
                      <p className="text-xs text-[#9E9E9E]">
                        {record.start_time} – {record.end_time} · {record.duration_hours}ч
                      </p>
                    )}
                  </div>
                  {isWorkingDay && (
                    <p className="text-sm font-bold text-[#388E3C] flex-shrink-0">
                      {record.earnings ? Math.round(record.earnings).toLocaleString("cs") + " Kč" : ""}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
