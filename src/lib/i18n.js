/**
 * Простая система интернационализации.
 * Язык хранится в localStorage и читается синхронно.
 */

const LANG_KEY = "app_language";

export const LANGUAGES = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "cs", label: "Čeština", flag: "🇨🇿" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
];

const TRANSLATIONS = {
  ru: {
    dashboard: "Дашборд",
    records: "Записи",
    analytics: "Статистика",
    calendar: "Календарь",
    tasks: "Задачи",
    profile: "Профиль",
    employees: "Сотрудники",
    schedule: "График",
    tasks_admin: "Задачи (Адм)",
    materials: "Материалы",
    reports: "Отчёты",
    settings: "Настройки",
    furniture: "Мебель",
    work_sites: "Площадки",
    logout: "Выйти",
    management: "Управление",
    hello: "Привет",
    add_record: "Добавить запись",
    recent_records: "Последние записи",
    hours: "часов",
    earnings: "заработок",
    working_days: "Рабочих дней",
    rate: "Ставка",
    language: "Язык",
    save: "Сохранить",
    cancel: "Отмена",
    edit: "Редактировать",
    delete: "Удалить",
    add: "Добавить",
    search: "Поиск",
    loading: "Загрузка...",
    no_data: "Данных нет",
    working: "Рабочий",
    sick: "Больничный",
    day_off: "Выходной",
    vacation: "Отпуск",
    my_records: "Мои записи",
    gps_check: "GPS-проверка",
    on_site: "Вы на объекте",
    off_site: "Вы не на объекте",
    checking_location: "Определение местоположения...",
  },
  cs: {
    dashboard: "Přehled",
    records: "Záznamy",
    analytics: "Statistiky",
    calendar: "Kalendář",
    tasks: "Úkoly",
    profile: "Profil",
    employees: "Zaměstnanci",
    schedule: "Rozvrh",
    tasks_admin: "Úkoly (Adm)",
    materials: "Materiály",
    reports: "Zprávy",
    settings: "Nastavení",
    furniture: "Nábytek",
    work_sites: "Pracoviště",
    logout: "Odhlásit",
    management: "Správa",
    hello: "Ahoj",
    add_record: "Přidat záznam",
    recent_records: "Poslední záznamy",
    hours: "hodin",
    earnings: "výdělek",
    working_days: "Pracovní dny",
    rate: "Sazba",
    language: "Jazyk",
    save: "Uložit",
    cancel: "Zrušit",
    edit: "Upravit",
    delete: "Smazat",
    add: "Přidat",
    search: "Hledat",
    loading: "Načítání...",
    no_data: "Žádná data",
    working: "Pracovní",
    sick: "Nemocenská",
    day_off: "Volno",
    vacation: "Dovolená",
    my_records: "Moje záznamy",
    gps_check: "GPS kontrola",
    on_site: "Jste na pracovišti",
    off_site: "Nejste na pracovišti",
    checking_location: "Zjišťování polohy...",
  },
  en: {
    dashboard: "Dashboard",
    records: "Records",
    analytics: "Analytics",
    calendar: "Calendar",
    tasks: "Tasks",
    profile: "Profile",
    employees: "Employees",
    schedule: "Schedule",
    tasks_admin: "Tasks (Admin)",
    materials: "Materials",
    reports: "Reports",
    settings: "Settings",
    furniture: "Furniture",
    work_sites: "Work Sites",
    logout: "Logout",
    management: "Management",
    hello: "Hello",
    add_record: "Add record",
    recent_records: "Recent records",
    hours: "hours",
    earnings: "earnings",
    working_days: "Working days",
    rate: "Rate",
    language: "Language",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    add: "Add",
    search: "Search",
    loading: "Loading...",
    no_data: "No data",
    working: "Working",
    sick: "Sick",
    day_off: "Day Off",
    vacation: "Vacation",
    my_records: "My Records",
    gps_check: "GPS Check",
    on_site: "You are on site",
    off_site: "You are not on site",
    checking_location: "Detecting location...",
  },
  uk: {
    dashboard: "Панель",
    records: "Записи",
    analytics: "Статистика",
    calendar: "Календар",
    tasks: "Завдання",
    profile: "Профіль",
    employees: "Співробітники",
    schedule: "Графік",
    tasks_admin: "Завдання (Адм)",
    materials: "Матеріали",
    reports: "Звіти",
    settings: "Налаштування",
    furniture: "Меблі",
    work_sites: "Майданчики",
    logout: "Вийти",
    management: "Управління",
    hello: "Привіт",
    add_record: "Додати запис",
    recent_records: "Останні записи",
    hours: "годин",
    earnings: "заробіток",
    working_days: "Робочих днів",
    rate: "Ставка",
    language: "Мова",
    save: "Зберегти",
    cancel: "Скасувати",
    edit: "Редагувати",
    delete: "Видалити",
    add: "Додати",
    search: "Пошук",
    loading: "Завантаження...",
    no_data: "Немає даних",
    working: "Робочий",
    sick: "Лікарняний",
    day_off: "Вихідний",
    vacation: "Відпустка",
    my_records: "Мої записи",
    gps_check: "GPS-перевірка",
    on_site: "Ви на об'єкті",
    off_site: "Ви не на об'єкті",
    checking_location: "Визначення місцезнаходження...",
  },
};

/**
 * Получить текущий язык из localStorage.
 * @returns {string}
 */
export function getCurrentLanguage() {
  return localStorage.getItem(LANG_KEY) || "ru";
}

/**
 * Установить язык в localStorage.
 * @param {string} lang
 */
export function setLanguage(lang) {
  localStorage.setItem(LANG_KEY, lang);
  window.dispatchEvent(new Event("language_change"));
}

/**
 * Перевести ключ на текущий язык.
 * @param {string} key
 * @returns {string}
 */
export function t(key) {
  const lang = getCurrentLanguage();
  const dict = TRANSLATIONS[lang] || TRANSLATIONS["ru"];
  return dict[key] || TRANSLATIONS["ru"][key] || key;
}

/**
 * React-хук для использования переводов с автообновлением.
 * Использует import React вручную чтобы не нарушать правила хука.
 */
import { useState, useEffect } from "react";

export function useTranslation() {
  const [lang, setLang] = useState(getCurrentLanguage());

  useEffect(function() {
    function handleChange() {
      setLang(getCurrentLanguage());
    }
    window.addEventListener("language_change", handleChange);
    return function() {
      window.removeEventListener("language_change", handleChange);
    };
  }, []);

  function translate(key) {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS["ru"];
    return dict[key] || TRANSLATIONS["ru"][key] || key;
  }

  return { t: translate, lang };
}