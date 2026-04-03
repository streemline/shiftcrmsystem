/**
 * Вычисляет количество часов между start_time и end_time.
 * Корректно обрабатывает ночные смены (переход через полночь).
 * Например: start="22:00", end="06:00" → 8 часов
 *
 * @param {string} startTime - "HH:MM"
 * @param {string} endTime   - "HH:MM"
 * @returns {number}
 */
export function calculateDurationHours(startTime, endTime) {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const startTotalMinutes = startHour * 60 + startMin;
  let endTotalMinutes = endHour * 60 + endMin;

  if (endTotalMinutes <= startTotalMinutes) {
    endTotalMinutes += 24 * 60;
  }

  const durationMinutes = endTotalMinutes - startTotalMinutes;
  return Math.round((durationMinutes / 60) * 100) / 100;
}

/**
 * @param {number} durationHours
 * @param {number} hourlyRate
 * @returns {number}
 */
export function calculateEarnings(durationHours, hourlyRate) {
  return Math.round(durationHours * hourlyRate * 100) / 100;
}

/**
 * @param {number} amount
 * @returns {string} например "1 250.00 €"
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return "0 Kč";
  return Math.round(amount).toLocaleString("cs") + " Kč";
}

/**
 * @param {number} hours
 * @returns {string} например "8.5 ч"
 */
export function formatHours(hours) {
  if (hours === null || hours === undefined) return "0 ч";
  return `${hours % 1 === 0 ? hours : hours.toFixed(1)} ч`;
}

/**
 * @param {number} monthIndex - 0-11
 * @returns {string}
 */
export function getMonthName(monthIndex) {
  const months = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];
  return months[monthIndex];
}

/**
 * @param {Date} date
 * @returns {string} "YYYY-MM"
 */
export function getYearMonth(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Возвращает все дни указанного месяца.
 * @param {number} year
 * @param {number} month - 1-12
 * @returns {Date[]}
 */
export function getDaysInMonth(year, month) {
  const days = [];
  const totalDays = new Date(year, month, 0).getDate();
  for (let day = 1; day <= totalDays; day++) {
    days.push(new Date(year, month - 1, day));
  }
  return days;
}

/**
 * Форматирует дату в "DD.MM.YYYY"
 * @param {string} dateStr - "YYYY-MM-DD"
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}.${month}.${year}`;
}

/**
 * Возвращает название месяца и год для заголовков.
 * @param {number} year
 * @param {number} month - 1-12
 * @returns {string} "Март 2025"
 */
export function getMonthYearTitle(year, month) {
  const months = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];
  return `${months[month - 1]} ${year}`;
}