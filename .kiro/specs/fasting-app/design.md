# Design — Intermittent Fasting PWA

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| UI framework | React 18 (JSX) | Already in project |
| Styling | TailwindCSS + `tailwind-merge` | Utility-first, dark mode via `dark:` |
| Build tool | Vite | Already in project; fast HMR |
| PWA | `vite-plugin-pwa` (Workbox) | Service worker + manifest generation |
| Backend / DB | Supabase (Postgres + Auth + Realtime) | Auth, RLS, hosted DB |
| Auth | Supabase Auth — Google & GitHub OAuth | Per tech steering |
| AI | HuggingFace Inference API (free tier) or local Ollama | Free, open-source, no PII risk |
| Charts | Recharts | Lightweight, React-native |
| Routing | React Router v6 | Standard SPA routing |
| State | React Context + `useReducer` (global) + local `useState` | No extra lib needed at this scale |
| Date handling | `date-fns` | Lightweight, tree-shakeable |
| Notifications | Web Push API + Supabase Edge Functions | PWA push reminders |

---

## Folder Structure

```
src/
├── common/
│   ├── components/        # Shared UI: Button, Card, Modal, ProgressBar, Badge
│   ├── hooks/             # useSupabase, useAuth, useLocalStorage, usePushNotification
│   ├── context/           # AuthContext, UserProfileContext
│   └── utils/             # bmi.js, dateUtils.js, fastingState.js, units.js
│
├── features/
│   ├── auth/
│   │   ├── SignIn.jsx
│   │   └── AuthCallback.jsx
│   │
│   ├── fasting-tracker/
│   │   ├── FastingTracker.jsx       # Main view
│   │   ├── FastingTimer.jsx         # Circular countdown
│   │   ├── ProtocolSelector.jsx     # OMAD / 16:8 / custom picker
│   │   ├── FastingStateBadge.jsx    # Fed / Early Fast / Ketosis / Deep Fast
│   │   ├── OmadCheckIn.jsx          # Single meal check-in for OMAD
│   │   └── hooks/
│   │       └── useFastingSession.js
│   │
│   ├── activity/
│   │   ├── ActivityCheckin.jsx      # Daily activity checkbox list
│   │   ├── CustomActivityInput.jsx
│   │   └── hooks/
│   │       └── useActivity.js
│   │
│   ├── streak-board/
│   │   ├── StreakBoard.jsx           # 52-week grid
│   │   ├── StreakTile.jsx            # Individual day tile
│   │   ├── DaySummaryModal.jsx
│   │   └── hooks/
│   │       └── useStreakData.js
│   │
│   ├── water-tracker/
│   │   ├── WaterTracker.jsx
│   │   ├── WaterProgress.jsx
│   │   ├── QuickAddButtons.jsx
│   │   └── hooks/
│   │       └── useWaterIntake.js
│   │
│   ├── weight/
│   │   ├── WeightLog.jsx
│   │   ├── WeightPromptModal.jsx     # Every-3-weeks nudge
│   │   ├── WeightChart.jsx           # Recharts line chart
│   │   └── hooks/
│   │       └── useWeightLog.js
│   │
│   ├── dashboard/
│   │   ├── Dashboard.jsx
│   │   ├── widgets/
│   │   │   ├── FastingWidget.jsx
│   │   │   ├── StreakWidget.jsx
│   │   │   ├── WaterWidget.jsx
│   │   │   ├── WeightWidget.jsx
│   │   │   └── AiSuggestionWidget.jsx
│   │   └── hooks/
│   │       └── useDashboardData.js
│   │
│   ├── ai-suggestions/
│   │   ├── AiSuggestion.jsx
│   │   ├── aiPromptBuilder.js        # Builds anonymised summary
│   │   └── aiClient.js               # HuggingFace / Ollama fetch wrapper
│   │
│   └── profile/
│       ├── Profile.jsx
│       ├── ProfileForm.jsx
│       └── hooks/
│           └── useProfile.js
│
├── nav/
│   └── Nav.jsx                       # Bottom nav bar (mobile-first)
│
├── landing/
│   └── Landing.jsx                   # Unauthenticated splash + sign-in
│
├── App.jsx
├── main.jsx
└── index.css
```

---

## Database Schema (Supabase / Postgres)

All tables have `user_id uuid references auth.users(id)` with RLS enabled: `user_id = auth.uid()`.

### `profiles`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | = auth.users id |
| display_name | text | |
| height_cm | numeric | |
| starting_weight_kg | numeric | |
| goal_weight_kg | numeric | |
| unit_system | text | `'metric'` or `'imperial'` |
| created_at | timestamptz | |

### `fasting_sessions`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| protocol | text | `'omad'`, `'16:8'`, `'18:6'`, `'20:4'`, `'custom'` |
| started_at | timestamptz | |
| ended_at | timestamptz | nullable — null = active fast |
| notes | text | optional |

### `daily_checkins`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| date | date | unique per user |
| activities | jsonb | `["gym","fasted","ran","custom:Yoga"]` |
| water_ml | integer | total for the day |
| fasting_session_id | uuid FK | nullable |

### `weight_logs`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| recorded_at | timestamptz | |
| weight_kg | numeric | |
| bmi | numeric | computed at insert |

### `ai_suggestions`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| generated_at | timestamptz | |
| suggestion_text | text | |
| context_summary | jsonb | anonymised input sent to AI |

---

## Routing

```
/                   → redirect to /dashboard (if authed) or /signin
/signin             → Landing / SignIn
/auth/callback      → Supabase OAuth callback
/dashboard          → Dashboard (default authed view)
/fast               → Fasting Tracker
/activity           → Activity Check-in
/streaks            → Streak Board
/water              → Water Tracker
/weight             → Weight Log & Chart
/profile            → Profile & Settings
```

---

## UI / UX Design Principles

### Mobile-first, thumb-friendly
- Primary interactive elements in the bottom 60% of the screen.
- Bottom navigation bar with 5 icons: Dashboard, Fast, Activity, Streaks, Profile.
- Cards are full-width on mobile, max-width 480 px, centered on desktop.

### Color Language

| State | Color |
|---|---|
| Fasting mode | Blue (`blue-600`) |
| Eating window | Green (`green-500`) |
| Streak tile — 0 activities | `gray-200` / `gray-700` (dark) |
| Streak tile — 1–2 activities | `green-200` |
| Streak tile — 3–4 activities | `green-400` |
| Streak tile — 5+ activities | `green-700` |
| Water progress | `sky-400` |
| Warning / prompt | `amber-400` |

### Dark Mode
Tailwind `dark:` variants throughout. Follows `prefers-color-scheme`.

---

## Key Component Designs

### Fasting Timer
- SVG circle with stroke-dashoffset animation representing time elapsed.
- Inner text: current phase name + hours:minutes remaining.
- Tap to expand to full fasting detail screen.

### Streak Board
- CSS Grid: 53 columns × 7 rows, each cell ~12 px square with 2 px gap.
- Horizontal scroll on mobile with sticky week-day labels on the left.
- Month labels above each column group.
- Tile color driven by `activities.length` for that date.

### AI Suggestion Card
- Card on dashboard with a sparkle icon.
- "Refresh" icon button triggers a new generation.
- Shows a skeleton loader while fetching.
- Cached in `ai_suggestions` table — only calls the API once per day unless manually refreshed.

---

## AI Integration

```
aiPromptBuilder.js builds a plain-text summary:
  - Last 7 days activity counts (no names)
  - Fasting adherence: days fasted / 7
  - Average water intake
  - Weight delta (if available)
  → sent to HuggingFace mistralai/Mistral-7B-Instruct-v0.2 (free tier)
    or locally via Ollama /api/generate

Response is a short motivational/advisory paragraph (≤ 150 words).
```

No PII (name, email, exact timestamps) is included in the prompt.

---

## PWA Configuration

```js
// vite.config.js (additions)
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Fast Track',
    short_name: 'FastTrack',
    theme_color: '#2563eb',   // blue-600
    background_color: '#0f172a',
    display: 'standalone',
    icons: [ /* 192, 512 px PNG */ ]
  },
  workbox: {
    runtimeCaching: [
      { urlPattern: /\/dashboard/, handler: 'NetworkFirst' },
      { urlPattern: /supabase\.co\/rest/, handler: 'NetworkFirst' },
    ]
  }
})
```

---

## Security Considerations

- Supabase RLS on every table — server enforces `user_id = auth.uid()`.
- Supabase `anon` key is public by design; no service-role key in the frontend.
- AI prompt is built client-side; no raw DB records are forwarded — only an aggregate summary.
- OAuth tokens are managed entirely by Supabase Auth; no custom token storage.
