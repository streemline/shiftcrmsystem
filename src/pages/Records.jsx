import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Clock, Download } from "lucide-react";
import WorkRecordForm from "../components/records/WorkRecordForm";
import WorkRecordItem from "../components/records/WorkRecordItem";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import EmptyState from "../components/shared/EmptyState";
import { exportToCSV } from "../utils/exportExcel";
import { getMonthYearTitle } from "../components/utils/timeUtils";
import { useTranslation } from "@/lib/i18n";

export default function Records() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

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
      500
    );
    setRecords(allRecords);
    setIsLoading(false);
  }

  function getFilteredRecords() {
    const yearMonth = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
    return records.filter(function(r) {
      return r.date && r.date.startsWith(yearMonth);
    });
  }

  function sumFilteredHours(filtered) {
    return filtered.reduce(function(sum, r) { return sum + (r.duration_hours || 0); }, 0);
  }

  function sumFilteredEarnings(filtered) {
    return filtered.reduce(function(sum, r) { return sum + (r.earnings || 0); }, 0);
  }

  async function handleSave(formData) {
    const recordPayload = {
      ...formData,
      employee_id: user.email,
      employee_name: user.full_name,
    };

    if (editingRecord) {
      await base44.entities.WorkRecord.update(editingRecord.id, recordPayload);
    } else {
      await base44.entities.WorkRecord.create(recordPayload);
    }

    setShowForm(false);
    setEditingRecord(null);
    await loadData();
  }

  function handleEdit(record) {
    setEditingRecord(record);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(record) {
    const confirmed = window.confirm("Удалить эту запись?");
    if (!confirmed) return;
    await base44.entities.WorkRecord.delete(record.id);
    await loadData();
  }

  function handleOpenNewForm() {
    setEditingRecord(null);
    setShowForm(true);
  }

  function handleCancelForm() {
    setShowForm(false);
    setEditingRecord(null);
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

  const filteredRecords = getFilteredRecords();
  const totalHours = sumFilteredHours(filteredRecords);
  const totalEarnings = sumFilteredEarnings(filteredRecords);

  function handleExport() {
    const mm = String(selectedMonth).padStart(2, "0");
    const filename = `WorkTime_${selectedYear}-${mm}.csv`;
    exportToCSV(filteredRecords, filename, user?.full_name || "");
  }

  if (isLoading) {
    return <div className="p-6"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-2xl mx-auto">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white">{t("my_records")}</h1>
        <div className="flex items-center gap-2">
          {filteredRecords.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 border border-[#2A2A2A] text-[#9E9E9E] hover:text-white hover:border-[#555] text-xs font-medium px-3 py-2 rounded-lg transition-all"
            >
              <Download size={13} />
              CSV
            </button>
          )}
          {!showForm && (
            <button
              onClick={handleOpenNewForm}
              className="flex items-center gap-1.5 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all"
            >
              <Plus size={13} />
              {t("add")}
            </button>
          )}
        </div>
      </div>

      {/* Форма добавления / редактирования */}
      {showForm && (
        <div className="mb-5">
          <WorkRecordForm
            initialData={editingRecord}
            hourlyRate={user?.hourly_rate || 0}
            onSave={handleSave}
            onCancel={handleCancelForm}
          />
        </div>
      )}

      {/* Навигация по месяцам */}
      <div className="flex items-center justify-between bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 mb-4">
        <button
          onClick={goToPrevMonth}
          className="text-[#9E9E9E] hover:text-white transition-colors p-1"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-white">
          {getMonthYearTitle(selectedYear, selectedMonth)}
        </span>
        <button
          onClick={goToNextMonth}
          className="text-[#9E9E9E] hover:text-white transition-colors p-1"
        >
          ›
        </button>
      </div>

      {/* Статистика месяца */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-white">{totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)}</p>
          <p className="text-xs text-[#9E9E9E]">{t("hours")}</p>
        </div>
        <div className="bg-[#1A1A1A] border border-[#388E3C]/30 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-[#388E3C]">{Math.round(totalEarnings).toLocaleString("cs")} Kč</p>
          <p className="text-xs text-[#9E9E9E]">{t("earnings")}</p>
        </div>
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-white">{filteredRecords.length}</p>
          <p className="text-xs text-[#9E9E9E]">{t("records").toLowerCase()}</p>
        </div>
      </div>

      {/* Список записей */}
      {filteredRecords.length === 0 ? (
        <EmptyState
          icon={<Clock size={24} />}
          title={t("no_data")}
          description="Добавьте первую запись рабочего времени"
          action={
            <button
              onClick={handleOpenNewForm}
              className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
            >
              {t("add_record")}
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {filteredRecords.map(function(record) {
            return (
              <WorkRecordItem
                key={record.id}
                record={record}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}