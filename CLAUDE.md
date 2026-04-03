# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Corporate mobile-first app for time tracking, task management, GPS check-in, and communication. Built with React + Supabase (migrated from Base44 BaaS). Dark "Business Dark" theme with red/green accents. Currency is Czech Koruna (Kč).

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build to /dist
npm run preview      # Preview production build
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix linting issues
npx vitest run       # Run all tests
npx vitest run src/lib/offlineQueue.test.js  # Run single test file
```

## Environment Setup

Create `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_APP_NAME=ShiftPro
```

## Architecture

**Frontend-only app.** All backend is Supabase — no server code exists in this repo. Local code handles UI, validation, offline queueing, and export.

### Authentication

`App.jsx` → `AuthProvider` (in `src/lib/AuthContext.jsx`) → Supabase Auth (`getSession`, `onAuthStateChange`) → loads profile from `profiles` table. Three roles: `employee`, `manager`, `admin` — access controlled via Supabase RLS policies. Password recovery route `/reset-password` is mounted outside `AuthenticatedApp` in `App.jsx` so it works without a session.

### Data Access

All CRUD goes through `src/api/base44Client.js` which wraps Supabase SDK with a Base44-compatible API: `base44.entities.{EntityName}.create/update/filter/list/delete/subscribe()`. Entity names map to Supabase tables via `TABLE_MAP` (e.g. `Task` → `app_tasks`, `User` → `profiles`). The field `created_date` is aliased to `created_at` via `normalizeRecord()`.

### Offline Queue

`src/lib/offlineQueue.js` — when `navigator.onLine` is false, create/update/delete operations are serialized to localStorage. On `window.online` event, `syncQueue()` replays them sequentially against Supabase.

### Notifications

`src/lib/notificationService.js` — uses Supabase Realtime (`postgres_changes`) for live push notifications + Web Notifications API for browser-level alerts when tab is hidden.

### GPS Check-in

`src/components/gps/` — `navigator.geolocation` + Haversine formula to verify employee is within a `WorkSite` radius before allowing clock-in. `ActiveShiftWidget` on Dashboard manages shift start/end.

### i18n

`src/lib/i18n.js` supports RU/EN/CS/UK. Use the `useTranslation()` hook and `t('key')` for all UI strings — never hardcode user-visible text. Language stored in localStorage, switches without page reload.

### Page Routing

Pages in `src/pages/` are registered in `src/pages.config.js`. That file is auto-generated — do not manually edit the `PAGES` object; only `mainPage` is editable.

### Validation

Zod schemas in `src/lib/validation.js` at form boundaries. Currently has `workRecordSchema`. Use `zodResolver` with React Hook Form for new forms.

## Code Style

Write code like an experienced Go developer applied to JavaScript:
- Explicit statements over clever tricks. No unnecessary destructuring, spread chains, or one-liners that sacrifice clarity.
- Clear variable names that describe their contents.
- Functions that do one thing and are easy to read start to finish.
- Prefer simple loops over array method chains when readability suffers.
- Use Zod schemas for validation at form boundaries.
- Readability is the top priority.
- Use `function` declarations (not arrow functions) for named functions within components — this is the existing pattern.

**Debugging rule:** Always identify the root cause, not just a superficial patch. Explain what went wrong at the source level and implement a fix that prevents recurrence.

## Key Libraries

| Purpose | Library |
|---|---|
| UI components | shadcn/ui (`src/components/ui/`) + Radix UI |
| Styling | Tailwind CSS |
| Backend | @supabase/supabase-js (via `src/lib/supabase-client.js`) |
| Forms | React Hook Form + Zod |
| State/Caching | @tanstack/react-query (5min stale time) |
| Charts | Recharts |
| Maps | react-leaflet |
| QR codes | react-qr-code + @yudiel/react-qr-scanner |
| Date utils | date-fns, moment |
| PDF export | jsPDF + html2canvas (`src/utils/pdfReports.js`) |
| Excel export | Custom CSV with UTF-8 BOM (`src/utils/exportExcel.js`) |
| Drag & drop | @hello-pangea/dnd |
| Toasts | sonner (primary), react-hot-toast (legacy) |
| Testing | Vitest + React Testing Library |

## Theme

Dark theme CSS variables defined in `src/Layout.jsx`:
- Background: `#0A0A0A` (main), `#1A1A1A` (cards)
- Accent colors: red `#D32F2F`, green `#388E3C`
- Text: white primary, `#9E9E9E` secondary, `#555` tertiary
