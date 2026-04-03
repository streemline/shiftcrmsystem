import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  FileText, Download, Users, Package, Clock,
  TrendingUp, FileSpreadsheet, ChevronDown, User,
} from 'lucide-react';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { generateEmployeePDF, generateSummaryPDF } from '@/utils/pdfReports';
import { exportWorkRecordsToExcel, exportMaterialsToExcel, exportSummaryToExcel } from '@/utils/exportExcel';

const MONTH_NAMES = [
  'Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь',
];

function getYearMonthOptions() {
  const opts = [];
  const now  = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
    });
  }
  return opts;
}

function calcEmployeeSummary(records) {
  const working  = records.filter(r => r.day_type === 'Working');
  return {
    workingDays:   working.length,
    sickDays:      records.filter(r => r.day_type === 'Sick').length,
    vacationDays:  records.filter(r => r.day_type === 'Vacation').length,
    totalHours:    working.reduce((s, r) => s + (r.duration_hours || 0), 0),
    totalEarnings: working.reduce((s, r) => s + (r.earnings || 0), 0),
  };
}

export default function Reports() {
  const [currentUser,    setCurrentUser]    = useState(null);
  const [users,          setUsers]          = useState([]);
  const [allRecords,     setAllRecords]     = useState([]);
  const [materials,      setMaterials]      = useState([]);
  const [isLoading,      setIsLoading]      = useState(true);
  const [generatingId,   setGeneratingId]   = useState(null); // employee id being generated
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [selectedMonth,  setSelectedMonth]  = useState(getYearMonthOptions()[0].value);

  const monthOptions = getYearMonthOptions();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  useEffect(function() { loadData(); }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const me = await base44.auth.me();
      setCurrentUser(me);

      if (me.role === 'admin' || me.role === 'manager') {
        const [allUsers, records, mats] = await Promise.all([
          base44.entities.User.list(),
          base44.entities.WorkRecord.list('-date', 5000),
          base44.entities.Material.list('-date', 1000),
        ]);
        setUsers(allUsers.filter(u => u.is_active !== false));
        setAllRecords(records);
        setMaterials(mats);
      } else {
        const [records, mats] = await Promise.all([
          base44.entities.WorkRecord.filter({ employee_id: me.email }, '-date', 1000),
          base44.entities.Material.filter({ employee_id: me.email }, '-date', 500),
        ]);
        setUsers([me]);
        setAllRecords(records);
        setMaterials(mats);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function getMonthRecords(employeeEmail) {
    return allRecords.filter(function(r) {
      return r.date && r.date.startsWith(selectedMonth) &&
             (!employeeEmail || r.employee_id === employeeEmail);
    });
  }

  function getMonthMaterials(employeeEmail) {
    return materials.filter(function(m) {
      return m.date && m.date.startsWith(selectedMonth) &&
             (!employeeEmail || m.employee_id === employeeEmail);
    });
  }

  // ── PDF для одного сотрудника ──────────────────────────────────────────────

  async function handleEmployeePDF(employee) {
    setGeneratingId(employee.id);
    try {
      const records = getMonthRecords(employee.email);
      await generateEmployeePDF(employee, records, selectedMonth, 'WorkTime');
    } finally {
      setGeneratingId(null);
    }
  }

  // ── Сводный PDF ──────────────────────────────────────────────────────────────

  async function handleSummaryPDF() {
    setGeneratingSummary(true);
    try {
      const records = getMonthRecords(null);
      await generateSummaryPDF(users, records, selectedMonth, 'WorkTime');
    } finally {
      setGeneratingSummary(false);
    }
  }

  // ── Excel экспорт ────────────────────────────────────────────────────────────

  function handleExcelRecords() {
    const records = getMonthRecords(isAdmin ? null : currentUser?.email);
    exportWorkRecordsToExcel(records, `work_records_${selectedMonth}`);
  }

  function handleExcelMaterials() {
    const mats = getMonthMaterials(isAdmin ? null : currentUser?.email);
    exportMaterialsToExcel(mats, `materials_${selectedMonth}`);
  }

  function handleExcelSummary() {
    const records = getMonthRecords(null);
    exportSummaryToExcel(users, records, selectedMonth);
  }

  // ── Рендер ───────────────────────────────────────────────────────────────────

  if (isLoading) return <div className="p-6"><LoadingSpinner text="Загрузка данных..." /></div>;

  const monthRecordsAll = getMonthRecords(null);
  const grandSummary    = calcEmployeeSummary(monthRecordsAll);

  const selectClass = 'bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D32F2F] appearance-none cursor-pointer';
  const btnPrimary  = 'flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors';
  const btnSecond   = 'flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-[#2A2A2A] disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors';

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-5xl mx-auto">

      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D32F2F]/10 border border-[#D32F2F]/20 flex items-center justify-center">
            <FileText size={20} className="text-[#D32F2F]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Отчёты</h1>
            <p className="text-xs text-[#555]">Генерация PDF и Excel-отчётов</p>
          </div>
        </div>

        {/* Выбор месяца */}
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={function(e) { setSelectedMonth(e.target.value); }}
            className={selectClass}
          >
            {monthOptions.map(function(opt) {
              return <option key={opt.value} value={opt.value}>{opt.label}</option>;
            })}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none" />
        </div>
      </div>

      {/* KPI карточки — итоги месяца */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Рабочих дней',   value: grandSummary.workingDays,                 unit: 'дн.',  icon: <Clock size={15} className="text-blue-400" />,          bg: 'bg-blue-400/10' },
          { label: 'Часов',          value: grandSummary.totalHours.toFixed(1),        unit: 'ч.',   icon: <TrendingUp size={15} className="text-[#388E3C]" />,     bg: 'bg-[#388E3C]/10' },
          { label: 'К выплате',      value: Math.round(grandSummary.totalEarnings).toLocaleString('cs'), unit: 'Kč', icon: <Package size={15} className="text-[#F57C00]" />,  bg: 'bg-[#F57C00]/10' },
          { label: 'Сотрудников',    value: users.length,                             unit: '',     icon: <Users size={15} className="text-[#D32F2F]" />,           bg: 'bg-[#D32F2F]/10' },
        ].map(function(card) {
          return (
            <div key={card.label} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mb-2`}>
                {card.icon}
              </div>
              <p className="text-xl font-bold text-white">{card.value} <span className="text-sm font-normal text-[#555]">{card.unit}</span></p>
              <p className="text-xs text-[#555] mt-0.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Сводные кнопки (только admin/manager) */}
      {isAdmin && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 mb-5">
          <p className="text-sm font-semibold text-white mb-3">Сводные отчёты</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleSummaryPDF} disabled={generatingSummary} className={btnPrimary}>
              <FileText size={16} />
              {generatingSummary ? 'Генерация...' : 'Сводный PDF'}
            </button>
            <button onClick={handleExcelSummary} className={btnSecond}>
              <FileSpreadsheet size={16} />
              Сводный Excel
            </button>
            <button onClick={handleExcelRecords} className={btnSecond}>
              <Download size={16} />
              Excel: Записи
            </button>
            <button onClick={handleExcelMaterials} className={btnSecond}>
              <Download size={16} />
              Excel: Материалы
            </button>
          </div>
        </div>
      )}

      {/* Таблица по сотрудникам */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden mb-5">
        <div className="px-4 py-3 border-b border-[#2A2A2A]">
          <p className="text-sm font-semibold text-white">
            {isAdmin ? 'Отчёты по сотрудникам' : 'Мой отчёт'}
          </p>
          <p className="text-xs text-[#555] mt-0.5">
            {monthOptions.find(o => o.value === selectedMonth)?.label}
          </p>
        </div>

        <div className="divide-y divide-[#2A2A2A]">
          {users.length === 0 && (
            <div className="p-8 text-center text-[#555] text-sm">Нет сотрудников</div>
          )}
          {users.map(function(employee) {
            const records  = getMonthRecords(employee.email);
            const summary  = calcEmployeeSummary(records);
            const isGen    = generatingId === employee.id;
            const hasData  = records.length > 0;

            return (
              <div key={employee.id} className="px-4 py-4 flex items-center gap-4 flex-wrap">
                {/* Аватар */}
                <div className="w-10 h-10 rounded-full bg-[#D32F2F]/20 flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-[#D32F2F]" />
                </div>

                {/* Инфо */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{employee.full_name || employee.email}</p>
                  <p className="text-xs text-[#555] truncate">{employee.email}</p>
                </div>

                {/* Статистика */}
                <div className="hidden md:flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm font-bold text-white">{summary.workingDays}</p>
                    <p className="text-xs text-[#555]">дней</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-white">{summary.totalHours.toFixed(1)}</p>
                    <p className="text-xs text-[#555]">часов</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#388E3C]">{Math.round(summary.totalEarnings).toLocaleString('cs')}</p>
                    <p className="text-xs text-[#555]">Kč</p>
                  </div>
                </div>

                {/* Кнопки */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={function() { handleEmployeePDF(employee); }}
                    disabled={isGen || !hasData}
                    className={btnPrimary}
                    title={hasData ? 'Скачать PDF' : 'Нет данных за период'}
                  >
                    <FileText size={15} />
                    {isGen ? 'Генерация...' : 'PDF'}
                  </button>
                  <button
                    onClick={function() { exportWorkRecordsToExcel(records, `${(employee.full_name || employee.email).replace(/\s+/g, '_')}_${selectedMonth}`); }}
                    disabled={!hasData}
                    className={btnSecond}
                    title={hasData ? 'Скачать Excel' : 'Нет данных за период'}
                  >
                    <FileSpreadsheet size={15} />
                    Excel
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Только для своих (сотрудники) */}
      {!isAdmin && (
        <div className="flex gap-2">
          <button onClick={handleExcelRecords} className={btnSecond}>
            <Download size={16} />
            Excel: Мои записи
          </button>
          <button onClick={handleExcelMaterials} className={btnSecond}>
            <Download size={16} />
            Excel: Материалы
          </button>
        </div>
      )}
    </div>
  );
}
