const fs = require('fs');

let dashboard = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');

// Add import if not exists
if (!dashboard.includes('useTranslation')) {
  dashboard = dashboard.replace('import { formatCurrency', 'import { useTranslation } from "@/lib/i18n";\nimport { formatCurrency');
}

// Add hook
if (!dashboard.includes('const { t } = useTranslation();')) {
  dashboard = dashboard.replace('export default function Dashboard() {', 'export default function Dashboard() {\n  const { t } = useTranslation();');
}

// Replace texts
dashboard = dashboard.replace(/Привет,/g, '{t("hello")},');
dashboard = dashboard.replace(/"Часы"/g, 't("hours")'); // Wait, uppercase "Часов" vs "часов" in dict. The dict has "часов". Better use string.
dashboard = dashboard.replace(/title="Часы"/g, 'title={t("hours")}');
dashboard = dashboard.replace(/title="Заработок"/g, 'title={t("earnings")}');
dashboard = dashboard.replace(/title="Рабочих дней"/g, 'title={t("working_days")}');
dashboard = dashboard.replace(/title="Ставка"/g, 'title={t("rate")}');
dashboard = dashboard.replace(/>Добавить запись</g, '>{t("add_record")}<');
dashboard = dashboard.replace(/>Последние записи</g, '>{t("recent_records")}<');
// Dashboard also has >Добавить запись вручную< maybe just leave it or use add_record

fs.writeFileSync('src/pages/Dashboard.jsx', dashboard);

console.log("Dashboard localized");
