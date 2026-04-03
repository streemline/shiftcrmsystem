# Шаг 3 — Push-уведомления через Supabase Realtime

**Дата:** 2026-04-03  
**Статус:** Выполнено ✅

---

## Архитектура

```
Событие в приложении
      │
      ▼
notificationService.createNotification()  ──►  Supabase (app_notifications)
                                                       │
                                            Supabase Realtime (postgres_changes)
                                                       │
                                     ┌─────────────────┴─────────────────┐
                                     ▼                                   ▼
                             NotificationBell                 Web Notifications API
                         (обновляет счётчик/список)          (если вкладка не в фокусе)
```

---

## Созданные файлы

### `src/lib/notificationService.js`

| Функция | Описание |
|---------|----------|
| `createNotification({recipientEmail, type, title, message, taskId})` | Создаёт одно уведомление в Supabase |
| `notifyByRoles(roles, payload)` | Уведомляет всех пользователей с заданными ролями |
| `subscribeToNotifications(email, onNew)` | Supabase Realtime подписка; показывает Browser Notification если вкладка скрыта |
| `markAsRead(id)` | Отмечает одно уведомление прочитанным |
| `markAllAsRead(email)` | Отмечает все уведомления пользователя прочитанными |
| `loadNotifications(email, limit)` | Загружает уведомления из Supabase |
| `requestBrowserPermission()` | Запрашивает разрешение на браузерные уведомления |
| `showBrowserNotification(title, body)` | Показывает нативное браузерное уведомление |

**Типы уведомлений:** `new_task`, `status_change`, `new_comment`, `furniture_take`, `furniture_return`, `gps_reminder`, `time_exceeded`, `material_added`, `system`

---

### `src/components/shared/NotificationBell.jsx` — переписан

- Использует `subscribeToNotifications()` вместо устаревшего stub
- Исправлен формат Supabase Realtime payload: `payload.new` вместо `event.data`
- Кнопка «Центр уведомлений →» открывает полную страницу
- Клик по уведомлению отмечает его как прочитанное

---

### `src/pages/NotificationCenter.jsx` — новая страница

**Возможности:**
- Полный список уведомлений (до 100 штук)
- **Фильтрация по типу** — чипы: Задачи / Статусы / Комментарии / Мебель / GPS / Лимиты / Система
- **Фильтрация по статусу** — Все / Непрочитанные / Прочитанные
- **«Прочитать все»** — одна кнопка для всех непрочитанных
- **«Удалить прочитанные»** — очищает прочитанные уведомления
- Удаление отдельных уведомлений
- Real-time обновление: новые уведомления появляются без перезагрузки
- Цветовые метки по типу (синий/фиолетовый/жёлтый/оранжевый/красный...)

---

### `src/main.jsx` — обновлён

Добавлена инициализация `initOfflineSync()` при старте приложения — toast-уведомление при синхронизации офлайн-записей.

---

## Использование в коде

```javascript
import { createNotification, notifyByRoles, NOTIF_TYPES } from '@/lib/notificationService';

// При создании задачи:
await notifyByRoles(['manager', 'admin'], {
  type: NOTIF_TYPES.NEW_TASK,
  title: 'Новая задача: ' + task.title,
  message: 'Задача назначена сотруднику',
  taskId: task.id,
});

// Для конкретного пользователя:
await createNotification({
  recipientEmail: 'employee@company.local',
  type: NOTIF_TYPES.GPS_REMINDER,
  title: 'Не забудьте отметиться на площадке',
  message: 'Вы начали работу, но GPS-отметка не зафиксирована',
});
```

---

## Следующий шаг

Шаг 4 → GPS-система учёта рабочего времени с привязкой к площадкам.
