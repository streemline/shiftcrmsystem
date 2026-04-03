# Шаг 1 — Подключение Supabase

**Дата:** 2026-04-03  
**Статус:** Выполнено ✅

---

## Что сделано

### База данных (Supabase project: `cuyyfrymyenbbzaqqebq`, регион: EU West)

Созданы следующие таблицы с RLS-политиками:

| Таблица Supabase       | Сущность в коде  | RLS                                         |
|------------------------|------------------|---------------------------------------------|
| `profiles`             | User             | SELECT: все; UPDATE: свой профиль           |
| `work_records`         | WorkRecord       | SELECT/INSERT/UPDATE: свой + admin/manager  |
| `work_sites`           | WorkSite         | SELECT: все; ALL: admin/manager             |
| `object_types`         | ObjectType       | SELECT: все; ALL: admin/manager             |
| `app_tasks`            | Task             | SELECT: все; ALL: admin/manager             |
| `app_task_comments`    | TaskComment      | SELECT: все; INSERT: любой auth             |
| `materials`            | Material         | SELECT: все; ALL: admin/manager             |
| `furniture_items`      | Furniture        | SELECT: все; ALL: admin/manager             |
| `furniture_usage`      | FurnitureUsage   | SELECT: все; INSERT: любой; UPDATE: свой    |
| `calendar_events`      | CalendarEvent    | SELECT: все; ALL: admin/manager             |
| `app_notifications`    | Notification     | SELECT/UPDATE: свой + admin/manager         |

Realtime включён для: `app_notifications`, `work_records`, `furniture_usage`, `app_tasks`, `profiles`.

### Триггер `on_auth_user_created`

Автоматически создаёт запись в `profiles` при регистрации нового пользователя через Supabase Auth.

### Изменённые файлы

| Файл | Изменение |
|------|-----------|
| `src/api/base44Client.js` | Полностью переписан: Supabase SDK вместо localStorage |
| `src/lib/supabase-client.js` | Обновлён: `import.meta.env` для URL/keys, realtime config |
| `src/lib/AuthContext.jsx` | Supabase Auth session + `onAuthStateChange` |
| `src/components/LoginPage.jsx` | Полноценная форма: вход / регистрация / сброс пароля |
| `src/lib/offlineQueue.js` | Восстановлена реальная очередь (Supabase-based sync) |

### Маппинг сущностей

```
Task           → app_tasks
WorkRecord     → work_records
WorkSite       → work_sites
Material       → materials
Furniture      → furniture_items
FurnitureUsage → furniture_usage
CalendarEvent  → calendar_events
TaskComment    → app_task_comments
Notification   → app_notifications
ObjectType     → object_types
User           → profiles
```

### Особенности реализации

- **API-совместимость**: `base44.entities.X.list/filter/create/update/delete/subscribe` работают идентично — страницы не изменялись.
- **Алиас `created_date`**: добавлен автоматически в каждую запись (`created_date = created_at`) для совместимости с существующим кодом.
- **Сортировка**: поле `created_date` маппится в `created_at` при Supabase-запросах.
- **Кэш профиля**: `auth.me()` кэширует профиль в памяти для уменьшения запросов.
- **Загрузка файлов**: через Supabase Storage (`app-files` bucket), fallback — base64 DataURL.

---

## Следующий шаг

Шаг 2 → Реализация PDF/Excel экспорта с профессиональным оформлением.
