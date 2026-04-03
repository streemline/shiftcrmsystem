# Project: Base44 WorkTime Application

## Project Overview
A corporate mobile-first React application designed for time tracking, task management, GPS-based location verification, and operational reporting. 

The application architecture follows a frontend-heavy approach, utilizing the **Base44 Backend-as-a-Service (BaaS)** for persistent data storage and authentication. It features a sophisticated offline synchronization engine to ensure continuity in environments with unstable connectivity.

## Technology Stack
- **Framework:** React + Vite
- **Language:** JavaScript
- **Styling:** Tailwind CSS with a "Business Dark" theme.
- **Backend/API:** Base44 BaaS (data management, auth, RLS).
- **Core Libraries:**
  - **Forms:** React Hook Form + Zod (validation)
  - **Charts:** Recharts
  - **Maps:** react-leaflet
  - **PDF/Export:** jsPDF, html2canvas, `exportExcel.js`
  - **State/Caching:** React Query
  - **Notifications:** Sonner

## Development Guidelines
- **Code Style:** Prioritize explicit, readable code (Go-style philosophy applied to JS). Avoid overly clever one-liners or complex method chains. Use clear variable names and single-responsibility functions.
- **Localization:** Use the `useTranslation()` hook from `src/lib/i18n.js` for all user-facing strings (RU, EN, CS, UK). Never hardcode UI text.
- **Architecture:** 
  - **Pages:** Auto-discovered in `src/pages.config.js`.
  - **API:** Access all entity operations via `src/api/base44Client.js`.
  - **Offline:** Use `src/lib/offlineQueue.js` for queueing operations when offline.
- **Validation:** Always use Zod schemas defined in `src/lib/validation.js` at form boundaries.

## Build and Run
- **Install:** `npm install`
- **Development:** `npm run dev` (starts on `http://localhost:5173`)
- **Linting:** `npm run lint` or `npm run lint:fix`
- **Build:** `npm run build`
- **Preview:** `npm run preview`

## Environment Configuration
Requires a `.env.local` file with the following variables:
```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url
```

## Documentation
- Refer to `docs/` for specific step-by-step feature development reports.
- Refer to `CLAUDE.md` for detailed architectural guidance and coding standards.
