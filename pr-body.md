## Summary

Implements the Dashboard feature — the first real domain module replacing the DummyComponent placeholder. Provides a clinic overview with aggregated statistics, revenue highlights, and a recent appointments table.

### Changes

**New Feature: Dashboard**
- `DashboardService` — Uses `forkJoin` to fetch all 4 API endpoints simultaneously and computes aggregate stats (total patients, doctors, upcoming appointments, pending bills, revenue)
- `Dashboard` component — Uses Angular Signals (`signal()`) for reactive state management with loading skeleton placeholders
- Stat cards grid — 4 responsive cards with icons, counts, and hover animations
- Revenue highlight card — Gradient styled card showing total paid revenue with decorative elements
- Recent appointments table — Top 5 appointments with patient avatars, doctor names, appointment types, dates, and color-coded status badges (scheduled/completed/cancelled)
- Lazy-loaded via `loadChildren` in `app.routes.ts` for optimal bundle splitting

**Mock Data Expansion**
- `patients.json`: 2 → 8 records
- `appointments.json`: 2 → 8 records (with varied statuses)
- `doctors.json`: 2 → 4 records (4 specializations)
- `billing.json`: 2 → 6 records (paid/pending/overdue)

**Naming Convention**
- Renamed all component files to use `.component` suffix (e.g., `sidebar.ts` → `sidebar.component.ts`)

### Testing
- `npm run build` passes cleanly — dashboard lazy-loaded as separate chunk
- Verified in browser: stat cards, revenue card, and appointments table all render correctly with live mock data
