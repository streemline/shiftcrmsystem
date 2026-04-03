import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { getMonthYearTitle, getDaysInMonth } from "../components/utils/timeUtils";

const EVENT_COLORS = {
  "Производство": "#D32F2F",
  "Выставка":     "#1976D2",
  "Выходной":     "#388E3C",
  "Другое":       "#9E9E9E",
};

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export default function Calendar() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  useEffect(function() {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    const currentUser = await base44.auth.me();
    setUser(currentUser);
    const allEvents = await base44.entities.CalendarEvent.list("-date", 500);
    setEvents(allEvents);
    setIsLoading(false);
  }

  function goToPrevMonth() {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else { setMonth(month - 1); }
  }

  function goToNextMonth() {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else { setMonth(month + 1); }
  }

  function getEventsForDate(dateStr) {
    return events.filter(function(e) {
      if (e.date !== dateStr) return false;
      if (!e.assigned_employees || e.assigned_employees.length === 0) return true;
      return e.assigned_employees.includes(user?.email);
    });
  }

  function buildCalendarGrid() {
    const days = getDaysInMonth(year, month);
    const firstDay = days[0];

    // Получаем день недели первого числа (0=Вс, 1=Пн ... 6=Сб)
    // Преобразуем в 0=Пн ... 6=Вс
    const rawDow = firstDay.getDay();
    const startOffset = rawDow === 0 ? 6 : rawDow - 1;

    // Добавляем пустые ячейки в начало
    const grid = [];
    for (let i = 0; i < startOffset; i++) {
      grid.push(null);
    }
    for (const day of days) {
      grid.push(day);
    }
    return grid;
  }

  const grid = buildCalendarGrid();
  const todayStr = now.toISOString().split("T")[0];

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  if (isLoading) {
    return <div className="p-6"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-5">Календарь</h1>

      {/* Навигация */}
      <div className="flex items-center justify-between bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 mb-4">
        <button onClick={goToPrevMonth} className="text-[#9E9E9E] hover:text-white transition-colors text-lg px-2">‹</button>
        <span className="text-sm font-semibold text-white">{getMonthYearTitle(year, month)}</span>
        <button onClick={goToNextMonth} className="text-[#9E9E9E] hover:text-white transition-colors text-lg px-2">›</button>
      </div>

      {/* Дни недели */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map(function(label) {
          return (
            <div key={label} className="text-center text-[10px] font-medium text-[#555] py-1">
              {label}
            </div>
          );
        })}
      </div>

      {/* Сетка дней */}
      <div className="grid grid-cols-7 gap-1 mb-5">
        {grid.map(function(date, idx) {
          if (!date) {
            return <div key={`empty-${idx}`} />;
          }

          const dateStr = date.toISOString().split("T")[0];
          const dayEvents = getEventsForDate(dateStr);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          return (
            <button
              key={dateStr}
              onClick={function() { setSelectedDate(isSelected ? null : dateStr); }}
              className={`
                relative flex flex-col items-center justify-start py-1.5 rounded-lg text-sm font-medium transition-all aspect-square
                ${isSelected ? "bg-[#D32F2F] text-white" : ""}
                ${isToday && !isSelected ? "border border-[#D32F2F] text-white" : ""}
                ${!isToday && !isSelected ? (isWeekend ? "text-[#555]" : "text-[#9E9E9E] hover:bg-[#1A1A1A] hover:text-white") : ""}
              `}
            >
              <span className="text-xs leading-none">
                {date.getDate()}
              </span>
              {/* Метки событий */}
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {dayEvents.slice(0, 2).map(function(event, eIdx) {
                    const color = EVENT_COLORS[event.event_type] || "#9E9E9E";
                    return (
                      <span
                        key={eIdx}
                        className="w-1 h-1 rounded-full"
                        style={{ background: color }}
                      />
                    );
                  })}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* События выбранного дня */}
      {selectedDate && (
        <div>
          <h2 className="text-sm font-semibold text-white mb-3">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("ru", {
              weekday: "long", day: "numeric", month: "long"
            })}
          </h2>

          {selectedDateEvents.length === 0 ? (
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 text-center">
              <p className="text-sm text-[#9E9E9E]">Нет событий</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDateEvents.map(function(event) {
                const color = EVENT_COLORS[event.event_type] || "#9E9E9E";
                return (
                  <div
                    key={event.id}
                    className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex items-start gap-3"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                      style={{ background: color }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">{event.title}</p>
                      <p className="text-xs text-[#9E9E9E]">{event.event_type}</p>
                      {event.description && (
                        <p className="text-xs text-[#555] mt-1">{event.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Легенда */}
      <div className="mt-5 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
        <p className="text-xs font-semibold text-[#9E9E9E] uppercase tracking-wider mb-3">Легенда</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(EVENT_COLORS).map(function([label, color]) {
            return (
              <div key={label} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-xs text-[#9E9E9E]">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}