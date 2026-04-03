import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import EmptyState from "../components/shared/EmptyState";
import { getMonthYearTitle } from "../components/utils/timeUtils";

const EVENT_TYPES = ["Производство", "Выставка", "Выходной", "Другое"];

const EVENT_COLORS = {
  "Производство": "#D32F2F",
  "Выставка":     "#1976D2",
  "Выходной":     "#388E3C",
  "Другое":       "#9E9E9E",
};

export default function AdminSchedule() {
  const [currentUser, setCurrentUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  // Форма
  const [formDate, setFormDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("Производство");
  const [formDescription, setFormDescription] = useState("");
  const [formEmployees, setFormEmployees] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(function() {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    const me = await base44.auth.me();
    setCurrentUser(me);

    if (me.role !== "admin" && me.role !== "manager") {
      setIsLoading(false);
      return;
    }

    const [allEvents, allUsers] = await Promise.all([
      base44.entities.CalendarEvent.list("-date", 500),
      base44.entities.User.list(),
    ]);

    setEvents(allEvents);
    setUsers(allUsers);
    setIsLoading(false);
  }

  function getMonthEvents() {
    const yearMonth = `${year}-${String(month).padStart(2, "0")}`;
    return events.filter(function(e) { return e.date?.startsWith(yearMonth); });
  }

  function goToPrevMonth() {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else { setMonth(month - 1); }
  }

  function goToNextMonth() {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else { setMonth(month + 1); }
  }

  async function handleSaveEvent(e) {
    e.preventDefault();
    setIsSaving(true);

    await base44.entities.CalendarEvent.create({
      date: formDate,
      end_date: formEndDate || null,
      start_time: formStartTime || null,
      end_time: formEndTime || null,
      title: formTitle,
      event_type: formType,
      description: formDescription,
      assigned_employees: formEmployees,
    });

    setFormDate("");
    setFormEndDate("");
    setFormStartTime("");
    setFormEndTime("");
    setFormTitle("");
    setFormType("Производство");
    setFormDescription("");
    setFormEmployees([]);
    setShowForm(false);
    await loadData();
    setIsSaving(false);
  }

  async function handleDeleteEvent(eventId) {
    setIsDeleting(eventId);
    await base44.entities.CalendarEvent.delete(eventId);
    await loadData();
    setIsDeleting(null);
  }

  function toggleEmployee(email) {
    setFormEmployees(function(prev) {
      if (prev.includes(email)) {
        return prev.filter(function(e) { return e !== email; });
      }
      return [...prev, email];
    });
  }

  if (isLoading) {
    return <div className="p-6"><LoadingSpinner /></div>;
  }

  if (currentUser?.role !== "admin" && currentUser?.role !== "manager") {
    return (
      <div className="p-6">
        <EmptyState
          icon={<CalendarDays size={24} />}
          title="Нет доступа"
          description="Эта страница только для администраторов и руководителей"
        />
      </div>
    );
  }

  const monthEvents = getMonthEvents();

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-white">График</h1>
        <button
          onClick={function() { setShowForm(!showForm); }}
          className="flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <Plus size={16} />
          Добавить
        </button>
      </div>

      {/* Форма добавления события */}
      {showForm && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 mb-5">
          <h2 className="text-base font-semibold text-white mb-4">Новое событие</h2>
          <form onSubmit={handleSaveEvent} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#9E9E9E] mb-1.5 block uppercase tracking-wider">Дата начала</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={function(e) { setFormDate(e.target.value); }}
                  required
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-[#9E9E9E] mb-1.5 block uppercase tracking-wider">Дата окончания</label>
                <input
                  type="date"
                  value={formEndDate}
                  onChange={function(e) { setFormEndDate(e.target.value); }}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#9E9E9E] mb-1.5 block uppercase tracking-wider">Время начала</label>
                <input
                  type="time"
                  value={formStartTime}
                  onChange={function(e) { setFormStartTime(e.target.value); }}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-[#9E9E9E] mb-1.5 block uppercase tracking-wider">Время окончания</label>
                <input
                  type="time"
                  value={formEndTime}
                  onChange={function(e) { setFormEndTime(e.target.value); }}
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-[#9E9E9E] mb-1.5 block uppercase tracking-wider">Тип</label>
              <select
                value={formType}
                onChange={function(e) { setFormType(e.target.value); }}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors"
              >
                {EVENT_TYPES.map(function(t) {
                  return <option key={t} value={t}>{t}</option>;
                })}
              </select>
            </div>

            <div>
              <label className="text-xs text-[#9E9E9E] mb-1.5 block uppercase tracking-wider">Название</label>
              <input
                type="text"
                value={formTitle}
                onChange={function(e) { setFormTitle(e.target.value); }}
                placeholder="Напр. Монтаж оборудования"
                required
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-[#9E9E9E] mb-1.5 block uppercase tracking-wider">Описание</label>
              <textarea
                value={formDescription}
                onChange={function(e) { setFormDescription(e.target.value); }}
                placeholder="Необязательно"
                rows={2}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] transition-colors resize-none placeholder-[#555]"
              />
            </div>

            {/* Выбор сотрудников */}
            <div>
              <label className="text-xs text-[#9E9E9E] mb-1.5 block uppercase tracking-wider">
                Сотрудники (пусто = для всех)
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {users.map(function(u) {
                  const isSelected = formEmployees.includes(u.email);
                  return (
                    <label key={u.id} className="flex items-center gap-2 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={function() { toggleEmployee(u.email); }}
                        className="accent-[#D32F2F]"
                      />
                      <span className="text-sm text-white">{u.full_name}</span>
                      <span className="text-xs text-[#555]">{u.email}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={function() { setShowForm(false); }}
                className="flex-1 py-2.5 rounded-lg border border-[#2A2A2A] text-[#9E9E9E] text-sm font-medium hover:border-[#555] transition-all"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-lg bg-[#D32F2F] text-white text-sm font-semibold hover:bg-[#B71C1C] disabled:opacity-50 transition-all"
              >
                {isSaving ? "Сохранение..." : "Создать"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Навигация по месяцам */}
      <div className="flex items-center justify-between bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 mb-4">
        <button onClick={goToPrevMonth} className="text-[#9E9E9E] hover:text-white transition-colors text-lg px-2">‹</button>
        <span className="text-sm font-semibold text-white">{getMonthYearTitle(year, month)}</span>
        <button onClick={goToNextMonth} className="text-[#9E9E9E] hover:text-white transition-colors text-lg px-2">›</button>
      </div>

      {/* Список событий */}
      {monthEvents.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={24} />}
          title="Событий нет"
          description="Добавьте события для этого месяца"
        />
      ) : (
        <div className="space-y-2">
          {monthEvents
            .sort(function(a, b) { return a.date.localeCompare(b.date); })
            .map(function(event) {
              const color = EVENT_COLORS[event.event_type] || "#9E9E9E";
              return (
                <div key={event.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex items-start gap-3">
                  <div className="flex-shrink-0 text-center w-10">
                    <p className="text-base font-bold text-white leading-none">
                      {event.date?.split("-")[2]}
                    </p>
                    <p className="text-xs text-[#9E9E9E]">
                      {event.date ? new Date(event.date + "T12:00:00").toLocaleDateString("ru", { month: "short" }) : ""}
                    </p>
                  </div>
                  <div className="w-px h-10 bg-[#2A2A2A] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                      <p className="text-sm font-semibold text-white">{event.title}</p>
                    </div>
                    <p className="text-xs text-[#9E9E9E]">
                      {event.event_type}
                      {(event.start_time || event.end_time) && (
                        <span className="ml-2 text-[#555]">
                          {event.start_time || ""}{event.end_time ? ` – ${event.end_time}` : ""}
                        </span>
                      )}
                      {event.end_date && event.end_date !== event.date && (
                        <span className="ml-2 text-[#555]">до {event.end_date}</span>
                      )}
                    </p>
                    {event.description && (
                      <p className="text-xs text-[#555] mt-0.5">{event.description}</p>
                    )}
                    {event.assigned_employees && event.assigned_employees.length > 0 && (
                      <p className="text-xs text-[#555] mt-0.5">
                        {event.assigned_employees.length} сотрудников
                      </p>
                    )}
                  </div>
                  <button
                    onClick={function() { handleDeleteEvent(event.id); }}
                    disabled={isDeleting === event.id}
                    className="p-2 text-[#9E9E9E] hover:text-[#D32F2F] hover:bg-[#D32F2F]/10 rounded-lg transition-all disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}