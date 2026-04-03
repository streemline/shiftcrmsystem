const fs = require('fs');

let content = fs.readFileSync('src/Layout.jsx', 'utf8');

// Add import
content = content.replace('import { base44 } from "@/api/base44Client";', 'import { base44 } from "@/api/base44Client";\nimport { useTranslation } from "@/lib/i18n";');

// Update NAV_ITEMS and ADMIN_ITEMS
content = content.replace(/"Дашборд"/g, '"dashboard"');
content = content.replace(/"Записи"/g, '"records"');
content = content.replace(/"Статистика"/g, '"analytics"');
content = content.replace(/"Календарь"/g, '"calendar"');
content = content.replace(/"Задачи"/g, '"tasks"');
content = content.replace(/"Мебель"/g, '"furniture"');
content = content.replace(/"Профиль"/g, '"profile"');

content = content.replace(/"Сотрудники"/g, '"employees"');
content = content.replace(/"График"/g, '"schedule"');
content = content.replace(/"Задачи \(Адм\)"/g, '"tasks_admin"');
content = content.replace(/"Материалы"/g, '"materials"');
content = content.replace(/"Отчёты"/g, '"reports"');
content = content.replace(/"Площадки"/g, '"work_sites"');
content = content.replace(/"Настройки"/g, '"settings"');

// Inject t hook
content = content.replace('export default function Layout({ children, currentPageName }) {\n', 'export default function Layout({ children, currentPageName }) {\n  const { t } = useTranslation();\n');

// Replace {item.label} with {t(item.label)}
content = content.replace(/\{item\.label\}/g, '{t(item.label)}');

// Replace "Управление" with {t("management")}
content = content.replace(/Управление/g, '{t("management")}');

// Replace "Выйти" with {t("logout")}
content = content.replace(/Выйти/g, '{t("logout")}');

fs.writeFileSync('src/Layout.jsx', content);
console.log('Layout updated');
