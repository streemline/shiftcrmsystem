/**
 * Параметры приложения — упрощённая версия без Base44.
 * Все данные хранятся локально в localStorage.
 */
export const appParams = {
  appId: import.meta.env.VITE_APP_ID || 'local',
  appBaseUrl: import.meta.env.VITE_APP_BASE_URL || window.location.origin,
};
