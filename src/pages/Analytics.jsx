import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { DailyHoursChart, YearlyChart, EarningsChart, ProductivityScore } from "../components/analytics/ProductivityChart";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { getMonthYearTitle } from "../components/utils/timeUtils";

const MONTHS = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"
];

export default function Analytics() {
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  useEffect(function() {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    const allRecords = await base44.entities.WorkRecord.filter(
      { employee_id: currentUser.email },
      "-date",
      1000
    );
    setRecords(allRecords);
    setIsLoading(false);
  }

  function getMonthRecords() {
    const yearMonth = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
    return records.filter(function(r) { return r.date?.startsWith(yearMonth); });
  }

  // Данные для графика — часы по дням текущего месяца
  function buildChartData() {
    const monthRecords = getMonthRecords();
    const daysMap = {};

    for (const r of monthRecords) {
      if (!r.date) continue;
      const day = parseInt(r.date.split("-")[2], 10);
      daysMap[day] = (daysMap[day] || 0) + (r.duration_hours || 0);
    }

    const result = [];
    for (const [day, hours] of Object.entries(daysMap)) {
      result.push({ day: `${day}`, hours: Math.round(hours * 10) / 10 });
    }

    result.sort(function(a, b) { return parseInt(a.day) - parseInt(b.day); });
    return result;
  }

  // Годовой обзор — часы и заработок по месяцам
  function buildYearlyData() {
    const yearRecords = records.filter(function(r) {
      return r.date?.startsWith(String(selectedYear));
    });

    const monthsMap = {};
    const earningsMap = {};
    for (const r of yearRecords) {
      if (!r.date) continue;
      const month = parseInt(r.date.split("-")[1], 10);
      monthsMap[month] = (monthsMap[month] || 0) + (r.duration_hours || 0);
      earningsMap[month] = (earningsMap[month] || 0) + (r.earnings || 0);
    }

    return MONTHS.map(function(label, idx) {
      const month = idx + 1;
      return {
        month: label,
        hours: Math.round((monthsMap[month] || 0) * 10) / 10,
        earnings: Math.round((earningsMap[month] || 0)),
      };
    });
  }

  function goToPrevMonth() {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  }

  function goToNextMonth() {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  }

  const monthRecords = getMonthRecords();
  const totalHours = monthRecords.reduce(function(s, r) { return s + (r.duration_hours || 0); }, 0);
  const totalEarnings = monthRecords.reduce(function(s, r) { return s + (r.earnings || 0); }, 0);
  const workingDays = monthRecords.filter(function(r) { return r.day_type === "Working"; }).length;
  const avgHoursPerDay = workingDays > 0 ? totalHours / workingDays : 0;

  const chartData = buildChartData();
  const yearlyData = buildYearlyData();

  if (isLoading) {
    return <div className="p-6"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-4">Статистика</h1>

      {/* Навигация по месяцам */}
      <div className="flex items-center justify-between bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 mb-4">
        <button onClick={goToPrevMonth} className="text-[#9E9E9E] hover:text-white transition-colors text-lg px-2">‹</button>
        <span className="text-sm font-semibold text-white">{getMonthYearTitle(selectedYear, selectedMonth)}</span>
        <button onClick={goToNextMonth} className="text-[#9E9E9E] hover:text-white transition-colors text-lg px-2">›</button>
      </div>

      {/* KPI карточки */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#1A1A1A] border border-[#D32F2F]/30 rounded-xl p-3">
          <p className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-1">Часов</p>
          <p className="text-xl font-bold text-white">{totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)}</p>
        </div>
        <div className="bg-[#1A1A1A] border border-[#388E3C]/30 rounded-xl p-3">
          <p className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-1">Заработок</p>
          <p className="text-xl font-bold text-[#388E3C]">{Math.round(totalEarnings).toLocaleString("cs")} Kč</p>
        </div>
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3">
          <p className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-1">Раб. дней</p>
          <p className="text-xl font-bold text-white">{workingDays}</p>
        </div>
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3">
          <p className="text-xs text-[#9E9E9E] uppercase tracking-wider mb-1">Сред. ч/день</p>
          <p className="text-xl font-bold text-white">{avgHoursPerDay % 1 === 0 ? avgHoursPerDay : avgHoursPerDay.toFixed(1)}</p>
        </div>
      </div>

      {/* Индекс продуктивности */}
      <ProductivityScore avgHours={avgHoursPerDay} workingDays={workingDays} totalEarnings={totalEarnings} />

      {/* График часов по дням */}
      {chartData.length === 0 ? (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 text-center mb-4">
          <p className="text-sm text-[#9E9E9E]">Нет данных за этот месяц</p>
        </div>
      ) : (
        <DailyHoursChart data={chartData} />
      )}

      {/* Годовые графики */}
      <YearlyChart data={yearlyData} />
      <EarningsChart data={yearlyData} />
    </div>
  );
}