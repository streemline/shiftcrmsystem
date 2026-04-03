const fs = require('fs');

// Layout.jsx
let layout = fs.readFileSync('src/Layout.jsx', 'utf8');
layout = layout.replace('import NotificationBell from "./components/shared/NotificationBell";', 
`import NotificationBell from "./components/shared/NotificationBell";
import { useTranslation } from "@/lib/i18n";`);

layout = layout.replace(/label: "Дашборд"/g, 'label: "dashboard"');
layout = layout.replace(/label: "Записи"/g, 'label: "records"');
layout = layout.replace(/label: "Статистика"/g, 'label: "analytics"');
layout = layout.replace(/label: "Календарь"/g, 'label: "calendar"');
layout = layout.replace(/label: "Задачи"/g, 'label: "tasks"');
layout = layout.replace(/label: "Мебель"/g, 'label: "furniture"');
layout = layout.replace(/label: "Профиль"/g, 'label: "profile"');

layout = layout.replace(/label: "Сотрудники"/g, 'label: "employees"');
layout = layout.replace(/label: "График"/g, 'label: "schedule"');
layout = layout.replace(/label: "Задачи \(Адм\)"/g, 'label: "tasks_admin"');
layout = layout.replace(/label: "Материалы"/g, 'label: "materials"');
layout = layout.replace(/label: "Отчёты"/g, 'label: "reports"');
layout = layout.replace(/label: "Площадки"/g, 'label: "work_sites"');
layout = layout.replace(/label: "Настройки"/g, 'label: "settings"');

layout = layout.replace('const location = useLocation();', 
  'const location = useLocation();\n  const { t } = useTranslation();');

layout = layout.replace(/{item\.label}/g, '{t(item.label)}');
layout = layout.replace(/>Управление</g, '>{t("management")}<');
layout = layout.replace(/>Выйти</g, '>{t("logout")}<');

fs.writeFileSync('src/Layout.jsx', layout);

console.log("Layout localized");
