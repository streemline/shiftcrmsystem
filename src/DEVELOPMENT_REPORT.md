# WorkTime App — Отчёт о разработке
**Дата:** 2026-04-03  
**Версия:** 2.0.0

---

## ✅ Шаг 1 — GPS-система контроля присутствия

### Что реализовано
- **Новая сущность `WorkSite`** — рабочие площадки с координатами (широта, долгота) и радиусом допустимого отклонения (метры).
- **Компонент `GpsCheckIn`** (`components/gps/GpsCheckIn.jsx`) — использует `navigator.geolocation.getCurrentPosition`, рассчитывает расстояние по формуле Haversine, показывает статус «На объекте» / «Не на объекте».
- **Страница `AdminSites`** — CRUD-управление площадками. Только admin/manager. Есть кнопка «Использовать моё текущее местоположение» для автозаполнения координат.
- **Маршрут** `/AdminSites` добавлен в App.jsx и сайдбар (раздел «Управление»).
- **Формула Haversine** корректно учитывает кривизну Земли.

### Ограничения
- GPS требует разрешения пользователя в браузере (HTTPS).
- Точность зависит от устройства (мобильный GPS ≈ 5-10м, ноутбук ≈ 50-200м).

---

## ✅ Шаг 2 — Многоязычность (RU / CS / EN / UK)

### Что реализовано
- **Файл `lib/i18n.js`** — полный словарь переводов на 4 языка: Русский, Čeština, English, Українська.
- **Хук `useTranslation()`** — реактивный, слушает event `language_change` через `window.addEventListener`.
- **Функции `t(key)`, `setLanguage(code)`, `getCurrentLanguage()`** — язык хранится в `localStorage`.
- **Переключатель языка в Профиле** — 4 кнопки с флагами, активный выделяется красным.
- Переключение мгновенное — перезагрузки страницы нет.

### Ключевые переводы
| Ключ | RU | CS | EN | UK |
|------|----|----|----|----|
| dashboard | Дашборд | Přehled | Dashboard | Панель |
| records | Записи | Záznamy | Records | Записи |
| furniture | Мебель | Nábytek | Furniture | Меблі |

---

## ✅ Шаг 3 — Страница «Мебель»

### Что реализовано
- **Сущности:** `Furniture` (позиции), `FurnitureUsage` (операции взять/вернуть).
- **Доступ:**
  - Просмотр — все пользователи.
  - Добавление/редактирование/удаление — только `manager` / `admin`.
  - Комментарий + качество — `Мебелщик`, `manager`, `admin`.
- **Операции «Взять на выставку» / «Вернуть»:**
  - Контроль остатков (нельзя взять больше, чем есть на складе).
  - Лимит редактирований — максимум 2 раза на пользователя/позицию.
  - При каждой операции уведомляются менеджеры и Мебелщики через `Notification`.
- **Аналитика на странице:** карточки «Позиций», «На складе», «На выставке».
- **Качество мебели:** 4 уровня (Отлично/Хорошо/Средне/Плохо), хранится в поле `quality`.
- **Картинки** — URL изображения, отображается превью 64×64.
- Пункт «Мебель» добавлен в основную навигацию (для всех).

---

## ✅ Шаг 4 — Диаграммы на Dashboard

### Что реализовано
- **График 1: «Часы по проектам»** — BarChart (Recharts), данные текущего месяца, цвет каждого столбца уникален.
- **График 2: «Динамика дохода за 3 месяца»** — AreaChart с градиентной заливкой.
- **Для менеджеров/admins** — агрегируются данные **всей команды** (не только своих записей).
- Тёмная тема tooltips совпадает с дизайном приложения.

---

## ✅ Шаг 5 — Офлайн-режим с очередью синхронизации

### Что реализовано
- **Файл `lib/offlineQueue.js`** — система очереди операций.
- **`enqueueOperation(entity, opType, data, id)`** — сохраняет операцию в `localStorage`.
- **`syncQueue()`** — при восстановлении соединения выполняет все отложенные операции.
- **`initOfflineSync(callback)`** — слушает `window.addEventListener("online", ...)`, вызывается при старте в `App.jsx`.
- **Toast-уведомление** при синхронизации: «Синхронизация: N записей отправлено».
- **`isOnline()`** — проверка `navigator.onLine`.

### Архитектура очереди
```
[Пользователь создаёт запись без интернета]
        ↓
[enqueueOperation() → localStorage]
        ↓
[Интернет восстановлен → window "online" event]
        ↓
[syncQueue() → iterate queue → API calls]
        ↓
[Успешные операции удаляются из очереди]
```

---

## ✅ Шаг 6 — Тестирование

### Тесты реализованы в `tests/`

#### GPS (Haversine formula)
```javascript
calcDistanceMeters(50.075538, 14.437800, 50.075538, 14.437800) === 0 // ✅ Та же точка
calcDistanceMeters(50.0, 14.0, 51.0, 14.0) ≈ 111000 // ✅ ~111 км на 1° широты
```

#### Offline Queue
```javascript
enqueueOperation("WorkRecord", "create", {...}) // → queue.length === 1
clearQueue() // → queue.length === 0
```

#### i18n
```javascript
setLanguage("en"); t("dashboard") === "Dashboard" // ✅
setLanguage("cs"); t("dashboard") === "Přehled"   // ✅
setLanguage("uk"); t("furniture") === "Меблі"     // ✅
```

#### Furniture limits
```javascript
editCount >= 2 → toast.error("Превышен лимит изменений") // ✅
qty > inStock  → toast.error("На складе только N шт.")   // ✅
```

---

## Архитектура (C4 — Component Level)

```
App.jsx
├── Layout (навигация + NotificationBell)
├── Dashboard (KPI + BarChart + AreaChart)
├── Records (WorkRecord CRUD + GPS check-in + offline queue)
├── AdminSites (WorkSite CRUD)
├── Furniture (Furniture + FurnitureUsage)
├── Profile (user data + language switcher)
├── AdminTasks (Task CRUD + notifications)
└── Reports (PDF generation)

lib/
├── i18n.js         — переводы, хук useTranslation
├── offlineQueue.js — очередь офлайн-операций
└── AuthContext.jsx — аутентификация

components/
└── gps/GpsCheckIn.jsx — GPS-проверка присутствия

entities/
├── WorkSite.json       — рабочие площадки (GPS)
├── Furniture.json      — мебель
├── FurnitureUsage.json — история операций
├── Task.json
├── WorkRecord.json
└── Notification.json
```

---

## Следующие шаги (v3.0)

1. **Push-уведомления** через Service Worker (браузерные push).
2. **Карта площадок** через react-leaflet с отображением зон (окружности).
3. **QR-коды мебели** — сканирование для быстрого добавления в выставку.
4. **Экспорт мебели** в PDF/Excel с фотографиями.
5. **Автоматическая GPS-отметка** при начале рабочей смены.
6. **Дашборд для мебелщика** — отдельная вкладка с историей операций.