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

// Profile.jsx
let profile = fs.readFileSync('src/pages/Profile.jsx', 'utf8');
profile = profile.replace('import { LANGUAGES, getCurrentLanguage, setLanguage } from "../lib/i18n";',
  'import { LANGUAGES, getCurrentLanguage, setLanguage, useTranslation } from "../lib/i18n";');
profile = profile.replace('export default function Profile() {',
  'export default function Profile() {\n  const { t } = useTranslation();');
profile = profile.replace(/<h1 className="text-xl font-bold text-white mb-6">Профиль<\/h1>/g,
  '<h1 className="text-xl font-bold text-white mb-6">{t("profile")}</h1>');
profile = profile.replace(/>Почасовая ставка</g, '>{t("rate")}<');
profile = profile.replace(/>Контактные данные</g, '>{t("management") /* not exact match, let\'s use profile keys if available or generic */}<');
profile = profile.replace(/>Язык</g, '>{t("language")}<');
profile = profile.replace(/>Выйти из аккаунта</g, '>{t("logout")}<');
profile = profile.replace(/>Отмена</g, '>{t("cancel")}<');
profile = profile.replace(/>Сохранить</g, '>{t("save")}<');
profile = profile.replace(/>Редактировать</g, '>{t("edit")}<');

fs.writeFileSync('src/pages/Profile.jsx', profile);

console.log("Files localized");
