/**
 * Профессиональная генерация PDF-отчётов для сотрудников.
 * Использует jsPDF (клиентская генерация, без серверного эндпоинта).
 */

const ACCENT_RED   = [211, 47, 47];
const ACCENT_GREEN = [56, 142, 60];
const DARK         = [20, 20, 20];
const GREY         = [100, 100, 100];
const LIGHT_GREY   = [240, 240, 240];
const WHITE        = [255, 255, 255];

const MONTH_NAMES_RU = [
  'Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'
];

const DAY_TYPE_LABELS = {
  Working:  'Рабочий',
  Sick:     'Больничный',
  'Day Off':'Выходной',
  Vacation: 'Отпуск',
};

function getMonthLabel(yearMonth) {
  const [year, month] = yearMonth.split('-');
  return `${MONTH_NAMES_RU[parseInt(month, 10) - 1]} ${year}`;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function setFont(doc, size, weight = 'normal', color = DARK) {
  doc.setFontSize(size);
  doc.setFont('helvetica', weight);
  doc.setTextColor(...color);
}

function drawLine(doc, x1, y, x2, color = LIGHT_GREY) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.line(x1, y, x2, y);
}

function addPageFooter(doc, pageNum, totalPages, generatedAt) {
  const y = 286;
  drawLine(doc, 15, y, 195, [200, 200, 200]);
  setFont(doc, 7, 'normal', [160, 160, 160]);
  doc.text(`Страница ${pageNum} из ${totalPages}`, 15, y + 5);
  doc.text('WorkTime — Система учёта рабочего времени', 105, y + 5, { align: 'center' });
  doc.text(`Сгенерировано: ${generatedAt}`, 195, y + 5, { align: 'right' });
}

function drawLogo(doc, x, y) {
  // Красный квадрат с часами
  doc.setFillColor(...ACCENT_RED);
  doc.roundedRect(x, y, 12, 12, 2, 2, 'F');
  doc.setDrawColor(...WHITE);
  doc.setLineWidth(0.6);
  doc.circle(x + 6, y + 6, 4, 'S');
  doc.line(x + 6, y + 4, x + 6, y + 6);
  doc.line(x + 6, y + 6, x + 8.5, y + 6);
}

// ── Заголовок страницы ────────────────────────────────────────────────────────

function drawHeader(doc, companyName, reportTitle, period) {
  // Фоновая полоса
  doc.setFillColor(...ACCENT_RED);
  doc.rect(0, 0, 210, 28, 'F');

  drawLogo(doc, 15, 8);

  setFont(doc, 16, 'bold', WHITE);
  doc.text(companyName, 32, 15);

  setFont(doc, 9, 'normal', [255, 180, 180]);
  doc.text('Система учёта рабочего времени', 32, 21);

  setFont(doc, 10, 'bold', WHITE);
  doc.text(reportTitle, 195, 12, { align: 'right' });
  setFont(doc, 9, 'normal', [255, 200, 200]);
  doc.text(period, 195, 19, { align: 'right' });
}

// ── Информационный блок сотрудника ───────────────────────────────────────────

function drawEmployeeCard(doc, employee, period, y) {
  doc.setFillColor(...LIGHT_GREY);
  doc.roundedRect(15, y, 180, 28, 2, 2, 'F');

  setFont(doc, 9, 'bold', GREY);
  doc.text('СОТРУДНИК', 22, y + 8);
  setFont(doc, 13, 'bold', DARK);
  doc.text(employee.full_name || employee.email || 'Не указано', 22, y + 17);
  setFont(doc, 8, 'normal', GREY);
  doc.text(employee.email || '', 22, y + 23);

  setFont(doc, 9, 'bold', GREY);
  doc.text('ПЕРИОД', 105, y + 8);
  setFont(doc, 12, 'bold', DARK);
  doc.text(period, 105, y + 17);

  setFont(doc, 9, 'bold', GREY);
  doc.text('СТАВКА', 160, y + 8);
  setFont(doc, 12, 'bold', ACCENT_GREEN);
  const rate = employee.hourly_rate ? `${employee.hourly_rate} Kč/ч` : 'Не указана';
  doc.text(rate, 160, y + 17);

  return y + 36;
}

// ── Таблица записей ───────────────────────────────────────────────────────────

const COL = { date: 15, type: 42, site: 80, time: 130, hours: 158, earn: 175 };

function drawTableHeader(doc, y) {
  doc.setFillColor(30, 30, 30);
  doc.rect(15, y, 180, 9, 'F');

  setFont(doc, 7.5, 'bold', WHITE);
  doc.text('ДАТА',       COL.date + 1, y + 6);
  doc.text('ТИП ДНЯ',   COL.type + 1, y + 6);
  doc.text('ОБЪЕКТ',     COL.site + 1, y + 6);
  doc.text('ВРЕМЯ',      COL.time + 1, y + 6);
  doc.text('ЧАСОВ',      COL.hours + 1, y + 6);
  doc.text('ЗАРАБОТОК',  COL.earn + 1, y + 6);
  return y + 11;
}

function drawTableRow(doc, record, y, isOdd) {
  if (isOdd) {
    doc.setFillColor(248, 248, 248);
    doc.rect(15, y, 180, 8, 'F');
  }

  const isWorking = record.day_type === 'Working';
  setFont(doc, 8, 'normal', DARK);
  doc.text(record.date || '', COL.date + 1, y + 5.5);

  const typeLabel = DAY_TYPE_LABELS[record.day_type] || record.day_type || '';
  setFont(doc, 8, isWorking ? 'normal' : 'italic', isWorking ? DARK : GREY);
  doc.text(typeLabel, COL.type + 1, y + 5.5);

  setFont(doc, 8, 'normal', GREY);
  const site = (record.object_type || '').substring(0, 18);
  doc.text(site, COL.site + 1, y + 5.5);

  if (isWorking && record.start_time && record.end_time) {
    setFont(doc, 8, 'normal', DARK);
    doc.text(`${record.start_time}–${record.end_time}`, COL.time + 1, y + 5.5);
  }

  if (isWorking) {
    setFont(doc, 8, 'bold', DARK);
    doc.text(String(record.duration_hours || 0), COL.hours + 1, y + 5.5);

    setFont(doc, 8, 'bold', ACCENT_GREEN);
    const earn = record.earnings ? Math.round(record.earnings).toLocaleString('cs') + ' Kč' : '';
    doc.text(earn, COL.earn + 1, y + 5.5);
  }

  drawLine(doc, 15, y + 8, 195, [230, 230, 230]);
  return y + 8;
}

// ── Итоговый блок ─────────────────────────────────────────────────────────────

function drawSummaryBox(doc, summary, y) {
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(15, y, 180, 40, 2, 2, 'F');

  doc.setDrawColor(...ACCENT_RED);
  doc.setLineWidth(1);
  doc.line(15, y, 15, y + 40);

  setFont(doc, 9, 'bold', GREY);
  doc.text('ИТОГИ ЗА ПЕРИОД', 22, y + 8);

  // Четыре колонки
  const cols = [22, 70, 118, 162];
  const items = [
    { label: 'Рабочих дней', value: String(summary.workingDays), color: DARK },
    { label: 'Отработано часов', value: summary.totalHours.toFixed(1), color: DARK },
    { label: 'К выплате', value: `${Math.round(summary.totalEarnings).toLocaleString('cs')} Kč`, color: ACCENT_GREEN },
    { label: 'Больничных/Отпуск', value: `${summary.sickDays}/${summary.vacationDays}`, color: GREY },
  ];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    setFont(doc, 7.5, 'normal', GREY);
    doc.text(item.label, cols[i], y + 18);
    setFont(doc, 14, 'bold', item.color);
    doc.text(item.value, cols[i], y + 30);
  }

  return y + 48;
}

// ── Площадки ─────────────────────────────────────────────────────────────────

function drawSitesSection(doc, records, y) {
  const sites = {};
  for (const r of records) {
    if (r.day_type === 'Working' && r.object_type) {
      if (!sites[r.object_type]) sites[r.object_type] = { hours: 0, days: 0 };
      sites[r.object_type].hours += r.duration_hours || 0;
      sites[r.object_type].days += 1;
    }
  }
  const siteList = Object.entries(sites);
  if (siteList.length === 0) return y;

  setFont(doc, 10, 'bold', DARK);
  doc.text('Работа по объектам', 15, y);
  y += 6;

  const colW = 86;
  let col = 0;
  let rowStartY = y;

  for (const [name, data] of siteList) {
    const x = 15 + col * (colW + 8);
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(...LIGHT_GREY);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, rowStartY, colW, 18, 1.5, 1.5, 'FD');

    setFont(doc, 8, 'bold', DARK);
    doc.text(name.substring(0, 22), x + 4, rowStartY + 7);
    setFont(doc, 7.5, 'normal', GREY);
    doc.text(`${data.days} дн. · ${data.hours.toFixed(1)} ч`, x + 4, rowStartY + 14);

    col++;
    if (col >= 2) {
      col = 0;
      rowStartY += 22;
    }
  }

  return (col > 0 ? rowStartY + 22 : rowStartY) + 4;
}

// ── Поле подписи ──────────────────────────────────────────────────────────────

function drawSignatureSection(doc, y) {
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  drawLine(doc, 15, y, 195, [200, 200, 200]);
  y += 10;

  setFont(doc, 9, 'bold', DARK);
  doc.text('ПОДПИСИ', 15, y);
  y += 8;

  // Левая — сотрудник
  setFont(doc, 8, 'normal', GREY);
  doc.text('Сотрудник:', 15, y);
  drawLine(doc, 15, y + 15, 85, DARK);
  setFont(doc, 7.5, 'normal', GREY);
  doc.text('(подпись)', 15, y + 20);
  doc.text('(дата)', 65, y + 20);

  // Правая — руководитель
  doc.text('Руководитель:', 115, y);
  drawLine(doc, 115, y + 15, 195, DARK);
  doc.text('(подпись)', 115, y + 20);
  doc.text('(дата)', 170, y + 20);

  // Печать
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.4);
  doc.circle(105, y + 13, 10, 'S');
  setFont(doc, 6, 'normal', [190, 190, 190]);
  doc.text('М.П.', 105, y + 14, { align: 'center' });

  return y + 30;
}

// ── Главная функция экспорта ──────────────────────────────────────────────────

/**
 * Генерирует PDF-отчёт для одного сотрудника за выбранный месяц.
 * @param {object} employee  - профиль сотрудника { full_name, email, hourly_rate, ... }
 * @param {Array}  records   - записи WorkRecord за месяц
 * @param {string} yearMonth - "2026-04"
 * @param {string} companyName
 */
export async function generateEmployeePDF(employee, records, yearMonth, companyName = 'WorkTime') {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const period = getMonthLabel(yearMonth);
  const generatedAt = new Date().toLocaleDateString('ru') + ' ' + new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });

  // Сортируем записи по дате
  const sorted = [...records].sort(function(a, b) { return a.date.localeCompare(b.date); });

  // Считаем итоги
  const summary = {
    workingDays:   sorted.filter(r => r.day_type === 'Working').length,
    sickDays:      sorted.filter(r => r.day_type === 'Sick').length,
    vacationDays:  sorted.filter(r => r.day_type === 'Vacation').length,
    dayOff:        sorted.filter(r => r.day_type === 'Day Off').length,
    totalHours:    sorted.reduce((s, r) => s + (r.duration_hours || 0), 0),
    totalEarnings: sorted.reduce((s, r) => s + (r.earnings || 0), 0),
  };

  drawHeader(doc, companyName, 'ТАБЕЛЬ УЧЁТА РАБОЧЕГО ВРЕМЕНИ', period);

  let y = 36;
  y = drawEmployeeCard(doc, employee, period, y);

  setFont(doc, 9, 'bold', DARK);
  doc.text('ДЕТАЛИЗАЦИЯ ЗАПИСЕЙ', 15, y);
  y += 5;
  y = drawTableHeader(doc, y);

  for (let i = 0; i < sorted.length; i++) {
    if (y > 270) {
      addPageFooter(doc, doc.internal.getCurrentPageInfo().pageNumber, '?', generatedAt);
      doc.addPage();
      drawHeader(doc, companyName, 'ТАБЕЛЬ УЧЁТА РАБОЧЕГО ВРЕМЕНИ', period);
      y = 36;
      y = drawTableHeader(doc, y);
    }
    y = drawTableRow(doc, sorted[i], y, i % 2 === 1);
  }

  y += 8;
  if (y + 50 > 280) { doc.addPage(); drawHeader(doc, companyName, 'ТАБЕЛЬ УЧЁТА РАБОЧЕГО ВРЕМЕНИ', period); y = 36; }
  y = drawSummaryBox(doc, summary, y);

  y = drawSitesSection(doc, sorted, y);
  y = drawSignatureSection(doc, y);

  // Финальные футеры
  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    addPageFooter(doc, p, total, generatedAt);
  }

  const safeName = (employee.full_name || employee.email || 'employee').replace(/\s+/g, '_');
  doc.save(`${safeName}_${yearMonth}.pdf`);
}

/**
 * Генерирует сводный PDF для всех сотрудников.
 */
export async function generateSummaryPDF(employees, allRecords, yearMonth, companyName = 'WorkTime') {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const period = getMonthLabel(yearMonth);
  const generatedAt = new Date().toLocaleDateString('ru') + ' ' + new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });

  drawHeader(doc, companyName, 'СВОДНЫЙ ОТЧЁТ', period);

  let y = 36;
  setFont(doc, 10, 'bold', DARK);
  doc.text('СВОДНАЯ ТАБЛИЦА ПО СОТРУДНИКАМ', 15, y);
  y += 7;

  // Шапка таблицы
  doc.setFillColor(30, 30, 30);
  doc.rect(15, y, 180, 9, 'F');
  setFont(doc, 7.5, 'bold', WHITE);
  doc.text('СОТРУДНИК',       16, y + 6);
  doc.text('РАБОЧИХ ДНЕЙ',    90, y + 6);
  doc.text('ЧАСОВ',          125, y + 6);
  doc.text('К ВЫПЛАТЕ (Kč)', 152, y + 6);
  y += 11;

  let grandHours = 0;
  let grandEarnings = 0;

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    const records = allRecords.filter(r => r.employee_id === emp.email);
    const hours = records.reduce((s, r) => s + (r.duration_hours || 0), 0);
    const earn  = records.reduce((s, r) => s + (r.earnings || 0), 0);
    const days  = records.filter(r => r.day_type === 'Working').length;

    grandHours    += hours;
    grandEarnings += earn;

    if (y > 270) {
      addPageFooter(doc, doc.internal.getCurrentPageInfo().pageNumber, '?', generatedAt);
      doc.addPage();
      drawHeader(doc, companyName, 'СВОДНЫЙ ОТЧЁТ', period);
      y = 36;
    }

    if (i % 2 === 1) {
      doc.setFillColor(248, 248, 248);
      doc.rect(15, y, 180, 9, 'F');
    }

    setFont(doc, 8, 'normal', DARK);
    doc.text((emp.full_name || emp.email || '').substring(0, 35), 16, y + 6);
    doc.text(String(days), 90, y + 6);
    setFont(doc, 8, 'bold', DARK);
    doc.text(hours.toFixed(1), 125, y + 6);
    setFont(doc, 8, 'bold', ACCENT_GREEN);
    doc.text(Math.round(earn).toLocaleString('cs') + ' Kč', 152, y + 6);

    drawLine(doc, 15, y + 9, 195, [230, 230, 230]);
    y += 9;
  }

  // Итоговая строка
  y += 4;
  doc.setFillColor(...ACCENT_RED);
  doc.rect(15, y, 180, 10, 'F');
  setFont(doc, 9, 'bold', WHITE);
  doc.text('ИТОГО:', 16, y + 7);
  doc.text(grandHours.toFixed(1), 125, y + 7);
  doc.text(Math.round(grandEarnings).toLocaleString('cs') + ' Kč', 152, y + 7);

  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    addPageFooter(doc, p, total, generatedAt);
  }

  doc.save(`summary_${yearMonth}.pdf`);
}
