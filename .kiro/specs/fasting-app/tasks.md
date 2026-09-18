# Tasks — Intermittent Fasting PWA

Implementation broken into phases. Each task references the requirement it satisfies. Work through phases in order; later phases depend on earlier foundations.

---

## Phase 1 — Project Foundation

### TASK-001 · Install and configure dependencies
**Refs:** REQ-NF-1, REQ-PWA-1  
- `npm install react-router-dom tailwindcss @tailwindcss/vite date-fns recharts @supabase/supabase-js tailwind-merge`
- `npm install -D vite-plugin-pwa`
- Initialise Tailwind config with `darkMode: 'media'` and content paths covering `src/**/*.{jsx,js}`.
- Add `@tailwindcss/vite` plugin and `vite-plugin-pwa` to `vite.config.js`.

### TASK-002 · Global styles and theme tokens
**Refs:** REQ-NF-5  
- Replace `src/index.css` with Tailwind directives and CSS custom properties for the color tokens defined in design.md (fasting blue, eating green, streak greens, water sky).
- Add a base `font-family` and mobile-safe viewport meta tag.

### TASK-003 · Supabase project setup
**Refs:** REQ-AUTH-1, REQ-NF-2, REQ-NF-3  
- Create a Supabase project.
- Run migrations to create all five tables: `profiles`, `fasting_sessions`, `daily_checkins`, `weight_logs`, `ai_suggestions`.
- Enable RLS and add `user_id = auth.uid()` policies for SELECT, INSERT, UPDATE, DELETE on every table.
- Store `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`.
- Create `src/common/hooks/useSupabase.js` exporting the singleton Supabase client.

### TASK-004 · React Router and app shell
**Refs:** Design routing table  
- Wrap `App.jsx` with `<BrowserRouter>`.
- Define all routes from the routing table in `App.jsx`.
- Create stub page components (empty `<div>`) for each route so navigation compiles.
- Add the bottom navigation bar (`src/nav/Nav.jsx`) with 5 icon links; hide on `/signin` and `/auth/callback`.

---

## Phase 2 — Authentication

### TASK-005 · Sign-in page
**Refs:** REQ-AUTH-1, REQ-AUTH-2  
- Build `src/features/auth/SignIn.jsx` with Google and GitHub OAuth buttons using `supabase.auth.signInWithOAuth()`.
- Style as a full-screen centered card with the app name and a brief tagline.

### TASK-006 · OAuth callback handler
**Refs:** REQ-AUTH-1  
- `src/features/auth/AuthCallback.jsx` reads the URL hash/params after redirect and calls `supabase.auth.exchangeCodeForSession()`.
- On success redirect to `/dashboard`; on error show a friendly error message.

### TASK-007 · Auth context and route guard
**Refs:** REQ-AUTH-2, REQ-AUTH-3  
- Create `src/common/context/AuthContext.jsx` that wraps the app, listens to `supabase.auth.onAuthStateChange`, and exposes `{ user, session, signOut }`.
- Create a `<PrivateRoute>` component that redirects to `/signin` when unauthenticated.
- Wrap all authenticated routes with `<PrivateRoute>`.

### TASK-008 · Profile creation on first sign-in
**Refs:** REQ-PROF-1  
- After first OAuth sign-in, check whether a `profiles` row exists for the user.
- If not, redirect to a first-run profile setup modal/page where user enters height, starting weight, goal weight, and unit preference.
- Upsert the `profiles` row on submit.

---

## Phase 3 — Fasting Tracker

### TASK-009 · Protocol selector
**Refs:** REQ-FAST-1  
- Build `src/features/fasting-tracker/ProtocolSelector.jsx`.
- Render buttons for OMAD, 16:8, 18:6, 20:4, and Custom.
- Custom opens a time picker for fasting start + duration.
- Persist selection to `daily_checkins.activities` context.

### TASK-010 · Fasting session hook
**Refs:** REQ-FAST-3, REQ-FAST-6  
- `useFastingSession.js` handles:
  - Loading any active (no `ended_at`) session from `fasting_sessions`.
  - `startFast(protocol, startedAt)` — inserts a new row.
  - `endFast(id)` — updates `ended_at = now()`.
  - Returns `{ activeSession, elapsedHours, fastingState, startFast, endFast }`.
- `fastingState` is derived via `src/common/utils/fastingState.js`:
  - `< 4 h` → `'fed'`, `4–12 h` → `'early'`, `12–18 h` → `'ketosis'`, `≥ 18 h` → `'deep'`.

### TASK-011 · Circular fasting timer
**Refs:** REQ-FAST-4  
- `FastingTimer.jsx` — SVG circle using `stroke-dashoffset` animation.
- Updates every minute via `setInterval`.
- Inner text shows phase name + HH:MM remaining (or elapsed for OMAD).

### TASK-012 · OMAD check-in
**Refs:** REQ-FAST-2  
- `OmadCheckIn.jsx` — a single "I just ate" button.
- On tap: logs meal timestamp, ends any active session, starts a new 23-hour fast session.

### TASK-013 · Fasting state badge
**Refs:** REQ-FAST-5  
- `FastingStateBadge.jsx` — pill badge with label and icon keyed to the four states.
- Colors: Fed = amber, Early = sky, Ketosis = violet, Deep = purple.

### TASK-014 · Fasting tracker page assembly
**Refs:** REQ-FAST-1 – REQ-FAST-6  
- Compose `FastingTracker.jsx` from: `ProtocolSelector`, `FastingTimer`, `FastingStateBadge`, `OmadCheckIn`.
- Show the correct sub-components based on selected protocol.

### TASK-015 · Fasting push notifications
**Refs:** REQ-FAST-7  
- Request `Notification` permission on first fast start.
- Schedule a `setTimeout` (or Supabase Edge Function cron) to fire when eating window opens/closes.
- Show a Web Notification with the phase change message.

---

## Phase 4 — Activity & Daily Check-In

### TASK-016 · Activity check-in UI
**Refs:** REQ-ACT-1, REQ-ACT-2  
- `ActivityCheckin.jsx` — checkbox list for the 5 default activities + a "+" button for custom.
- Each checkbox is a large, thumb-friendly tap target (min 48 px height).

### TASK-017 · Custom activity input
**Refs:** REQ-ACT-3  
- `CustomActivityInput.jsx` — text field to add a one-off activity label.
- Previous custom labels are retrieved from the user's `daily_checkins` history and shown as chips for quick re-selection.

### TASK-018 · Activity persistence hook
**Refs:** REQ-ACT-2  
- `useActivity.js` — upserts `daily_checkins` for today's date with updated `activities` array on every change.
- Optimistic update: update local state immediately, sync to Supabase in the background.

---

## Phase 5 — Streak Board

### TASK-019 · Streak data hook
**Refs:** REQ-STREAK-1, REQ-STREAK-2  
- `useStreakData.js` — fetches all `daily_checkins` rows for the last 365 days and returns a map `{ [dateString]: { activities, water_ml } }`.
- Derives a `currentStreak` integer (consecutive days with at least one activity).

### TASK-020 · Streak board grid
**Refs:** REQ-STREAK-1, REQ-STREAK-2  
- `StreakBoard.jsx` — CSS Grid 53 × 7.
- Each `StreakTile` receives `activityCount` and renders the matching green shade.
- Month labels rendered above the grid at the correct column.
- Horizontal scroll on mobile using `overflow-x: auto` on a wrapping div.

### TASK-021 · Day summary modal
**Refs:** REQ-STREAK-3  
- `DaySummaryModal.jsx` — opens on tile tap.
- Shows: date, activities list, water total, fasting hours, weight if logged.
- Close button and backdrop click dismiss the modal.

---

## Phase 6 — Water Tracker

### TASK-022 · Water intake hook
**Refs:** REQ-WATER-1, REQ-WATER-5  
- `useWaterIntake.js` — loads today's `water_ml` from `daily_checkins`, exposes `addWater(ml)` and `resetWater()`.
- Unit conversion utility in `src/common/utils/units.js` converts ml ↔ oz based on profile preference.

### TASK-023 · Water tracker UI
**Refs:** REQ-WATER-2, REQ-WATER-3, REQ-WATER-4  
- `WaterTracker.jsx` — contains `WaterProgress` (animated horizontal bar) and `QuickAddButtons` (250 / 500 / 750 / 1000 ml).
- Progress bar color transitions from sky-200 to sky-600 as goal is approached.
- Daily goal configurable via a small edit icon that opens an inline number input.

---

## Phase 7 — Weight Tracking

### TASK-024 · Weight log hook
**Refs:** REQ-WEIGHT-1, REQ-WEIGHT-2, REQ-WEIGHT-3  
- `useWeightLog.js` — fetches all `weight_logs` for the user, exposes `logWeight(kg)` which inserts a new row and computes BMI from profile height.
- Exposes `latestWeight`, `bmi`, `progressPercent` toward goal weight.

### TASK-025 · Weight chart
**Refs:** REQ-WEIGHT-4  
- `WeightChart.jsx` — Recharts `LineChart` with a reference line at goal weight.
- X-axis: date labels. Y-axis: weight in user's preferred unit.
- Responsive container fills its parent width.

### TASK-026 · Weight prompt modal
**Refs:** REQ-WEIGHT-1  
- On app load, check if the last `weight_logs` entry is ≥ 21 days old (or if no entry exists).
- If so, show `WeightPromptModal.jsx` — a non-blocking bottom sheet with "Log now" and "Remind me later" (snooze 3 days) options.

---

## Phase 8 — Dashboard

### TASK-027 · Dashboard widget assembly
**Refs:** REQ-DASH-1, REQ-DASH-2  
- `Dashboard.jsx` — 2-column grid on mobile using Tailwind `grid-cols-2`, single column on very small screens.
- Compose widgets: `FastingWidget`, `StreakWidget`, `WaterWidget`, `WeightWidget`, `AiSuggestionWidget`.
- Each widget is a card with a title, key metric, and a "→" link to the full feature page.

### TASK-028 · Dashboard data hook
**Refs:** REQ-DASH-1  
- `useDashboardData.js` — parallel-fetches all data needed by widgets in a single hook using `Promise.all`.
- Returns a single `{ fasting, streak, water, weight, aiSuggestion }` object.

---

## Phase 9 — AI Suggestions

### TASK-029 · AI prompt builder
**Refs:** REQ-AI-1, REQ-AI-2, REQ-AI-5  
- `aiPromptBuilder.js` accepts `{ lastWeekActivities, fastingAdherence, avgWaterMl, weightDeltaKg }` and returns a plain-text prompt string.
- No names, emails, or timestamps included.

### TASK-030 · AI client
**Refs:** REQ-AI-1  
- `aiClient.js` exports `generateSuggestion(prompt)`.
- Primary: HuggingFace Inference API — `mistralai/Mistral-7B-Instruct-v0.2`, free tier.
- Fallback: check `VITE_OLLAMA_URL` env var; if set, POST to Ollama's `/api/generate`.
- Returns suggestion text string; throws on error.

### TASK-031 · AI suggestion card
**Refs:** REQ-AI-3, REQ-AI-4  
- `AiSuggestion.jsx` and `AiSuggestionWidget.jsx`:
  - On load, check `ai_suggestions` for a row from today; if found, display it.
  - If not found (or user taps "Refresh"), call `aiClient.generateSuggestion`, save to Supabase, display.
  - Show a `Skeleton` loader while fetching.

---

## Phase 10 — PWA & Polish

### TASK-032 · PWA manifest and service worker
**Refs:** REQ-PWA-1, REQ-PWA-2, REQ-PWA-3  
- Configure `vite-plugin-pwa` with manifest fields from design.md.
- Generate 192 × 192 and 512 × 512 app icons (can use a simple SVG → PNG conversion).
- Verify Lighthouse PWA score ≥ 90.

### TASK-033 · Offline support
**Refs:** REQ-PWA-2  
- Workbox `runtimeCaching` for `/dashboard`, `/fast`, `/streaks` routes and Supabase REST calls (NetworkFirst strategy).
- Show a subtle offline banner when `navigator.onLine === false`.

### TASK-034 · Profile page
**Refs:** REQ-PROF-1, REQ-PROF-2, REQ-PROF-3  
- `Profile.jsx` — displays and edits the `profiles` row fields.
- "Delete all my data" button: shows a confirmation dialog, then deletes all user rows from every table and calls `supabase.auth.signOut()`.
- "Sign out" button.

### TASK-035 · Responsive layout and a11y pass
**Refs:** REQ-NF-4  
- Audit every interactive element for `min-h-[48px]` tap targets.
- Add `aria-label` to all icon-only buttons.
- Test with VoiceOver on iOS.

### TASK-036 · Performance audit
**Refs:** REQ-NF-1  
- Run Lighthouse in CI (or manually) and confirm LCP < 3 s on simulated 4G.
- Code-split routes with `React.lazy` + `Suspense` if bundle > 200 kB.

---

## Phase 11 — Testing & Deployment

### TASK-037 · Unit tests for utilities
- Test `fastingState.js` (all four state boundaries).
- Test `bmi.js` calculation.
- Test `aiPromptBuilder.js` output contains no PII patterns.
- Use Vitest (matches Vite ecosystem).

### TASK-038 · Integration tests for Supabase hooks
- Mock Supabase client with `vi.mock`.
- Test `useFastingSession`, `useWaterIntake`, `useWeightLog` for correct insert/update calls.

### TASK-039 · Deploy to GitHub Pages / Vercel
- Update `vite.config.js` `base` path if deploying to a subdirectory.
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as repository secrets / environment variables.
- Add Supabase Auth redirect URL for the production domain.
