/**
 * Экспорт данных в Excel-совместимый формат (CSV с BOM).
 * Открывается в Excel/LibreOffice напрямую с корректной кириллицей.
 */

const DAY_TYPE_RU = {
  Working:  'Рабочий',
  Sick:     'Больничный',
  'Day Off':'Выходной',
  Vacation: 'Отпуск',
};

function escapeCsv(value) {
  const s = String(value ?? '').replace(/"/g, '""');
  return `"${s}"`;
}

function buildCsv(headers, rows) {
  const lines = [headers.map(escapeCsv).join(';')];
  for (const row of rows) {
    lines.push(row.map(escapeCsv).join(';'));
  }
  return '\uFEFF' + lines.join('\r\n'); // BOM + CRLF для Excel
}

function downloadCsv(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Экспорт рабочих записей ───────────────────────────────────────────────────

/**
 * Экспортирует записи рабочего времени в Excel-совместимый CSV.
 * @param {Array}  records  - массив WorkRecord
 * @param {string} filename - имя файла без расширения
 */
export function exportWorkRecordsToExcel(records, filename = 'work_records') {
  const headers = [
    'Дата', 'Сотрудник', 'Email', 'Тип дня', 'Объект',
    'Начало', 'Конец', 'Часов', 'Заработок (Kč)', 'GPS', 'Заметки',
  ];

  const sorted = [...records].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const rows = sorted.map(function(r) {
    return [
      r.date || '',
      r.employee_name || '',
      r.employee_id || '',
      DAY_TYPE_RU[r.day_type] || r.day_type || '',
      r.object_type || '',
      r.start_time || '',
      r.end_time || '',
      r.duration_hours != null ? r.duration_hours : '',
      r.earnings != null ? Math.round(r.earnings) : '',
      r.is_gps_verified ? 'Да' : 'Нет',
      r.notes || '',
    ];
  });

  // Итоговая строка
  const totalHours    = records.reduce((s, r) => s + (r.duration_hours || 0), 0);
  const totalEarnings = records.reduce((s, r) => s + (r.earnings || 0), 0);
  rows.push(['', '', '', '', '', '', 'ИТОГО:', totalHours.toFixed(1), Math.round(totalEarnings), '', '']);

  downloadCsv(buildCsv(headers, rows), `${filename}.csv`);
}

/**
 * Экспортирует материалы в Excel-совместимый CSV.
 */
export function exportMaterialsToExcel(materials, filename = 'materials') {
  const headers = [
    'Дата', 'Название', 'Категория', 'Количество', 'Единица',
    'Цена/ед. (Kč)', 'Итого (Kč)', 'Сотрудник', 'Заметки',
  ];

  const sorted = [...materials].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const rows = sorted.map(function(m) {
    return [
      m.date || '',
      m.name || '',
      m.category || '',
      m.quantity != null ? m.quantity : '',
      m.unit || 'шт',
      m.unit_price != null ? m.unit_price : '',
      m.total_cost != null ? Math.round(m.total_cost) : '',
      m.employee_id || '',
      m.notes || '',
    ];
  });

  const totalCost = materials.reduce((s, m) => s + (m.total_cost || 0), 0);
  rows.push(['', '', '', '', '', 'ИТОГО:', Math.round(totalCost), '', '']);

  downloadCsv(buildCsv(headers, rows), `${filename}.csv`);
}

/**
 * Экспортирует сводный отчёт по сотрудникам в Excel.
 */
export function exportSummaryToExcel(employees, allRecords, yearMonth, filename) {
  const safeFilename = filename || `summary_${yearMonth}`;

  const headers = [
    'Сотрудник', 'Email', 'Ставка (Kč/ч)', 'Рабочих дней',
    'Больничных', 'Выходных', 'Отпуск', 'Часов', 'К выплате (Kč)',
  ];

  const rows = employees.map(function(emp) {
    const records = allRecords.filter(r => r.employee_id === emp.email);
    const working  = records.filter(r => r.day_type === 'Working').length;
    const sick     = records.filter(r => r.day_type === 'Sick').length;
    const dayoff   = records.filter(r => r.day_type === 'Day Off').length;
    const vacation = records.filter(r => r.day_type === 'Vacation').length;
    const hours    = records.reduce((s, r) => s + (r.duration_hours || 0), 0);
    const earn     = records.reduce((s, r) => s + (r.earnings || 0), 0);

    return [
      emp.full_name || '',
      emp.email || '',
      emp.hourly_rate || 0,
      working,
      sick,
      dayoff,
      vacation,
      hours.toFixed(1),
      Math.round(earn),
    ];
  });

  const grandHours = allRecords.reduce((s, r) => s + (r.duration_hours || 0), 0);
  const grandEarn  = allRecords.reduce((s, r) => s + (r.earnings || 0), 0);
  rows.push(['ИТОГО', '', '', '', '', '', '', grandHours.toFixed(1), Math.round(grandEarn)]);

  downloadCsv(buildCsv(headers, rows), `${safeFilename}.csv`);
}

// Оставляем старое имя для совместимости
export function exportToCSV(records, filename) {
  exportWorkRecordsToExcel(records, filename.replace(/\.csv$/i, ''));
}
