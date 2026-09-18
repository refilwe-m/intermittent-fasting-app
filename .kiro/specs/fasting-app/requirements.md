# Requirements — Intermittent Fasting PWA

## Overview

A personal weight-loss companion PWA. The app acts as a daily journal and accountability tool — tracking fasts, activity, water intake, and body metrics — while providing AI-powered suggestions to keep the user on track.

---

## Functional Requirements

### 1. Authentication

- **REQ-AUTH-1**: Users can sign in with Google or GitHub via Supabase Auth.
- **REQ-AUTH-2**: Unauthenticated users are redirected to a landing/sign-in page.
- **REQ-AUTH-3**: Session persists across page reloads and app restarts (PWA).

---

### 2. Fasting Tracker

- **REQ-FAST-1**: User can select a fasting protocol per day: OMAD, 16:8, 18:6, 20:4, or custom (start/end hours).
- **REQ-FAST-2**: For OMAD — user taps a "Check-in: I ate" button to log their single meal.
- **REQ-FAST-3**: For time-window protocols (16:8, 18:6, etc.) — user sets a fasting start time and the app calculates and displays the current mode: **Fasting** or **Eating Window**.
- **REQ-FAST-4**: A circular countdown timer shows hours and minutes remaining in the current phase.
- **REQ-FAST-5**: The app shows the biological fasting state based on hours elapsed since last meal: Fed (0–4 h), Early Fast (4–12 h), Ketosis Entry (12–18 h), Deep Fast (18+ h).
- **REQ-FAST-6**: User can manually start and end a fast with timestamps stored in Supabase.
- **REQ-FAST-7**: Push notifications (PWA) remind the user when their eating window opens or closes, if permission is granted.

---

### 3. Activity & Daily Check-In

- **REQ-ACT-1**: Each day the user can check off one or more activities:
  - Went to the gym
  - Fasted (any protocol)
  - Ran
  - Walked and hit step goal
  - Hiked
  - Custom activity (free-text label, e.g. "Yoga", "Swim")
- **REQ-ACT-2**: Each checked activity contributes to that day's streak tile.
- **REQ-ACT-3**: Custom activity entries are saved and re-usable on future days.

---

### 4. Daily Streak Board

- **REQ-STREAK-1**: A GitHub-style contribution grid shows the last 52 weeks (365 days) as colored tiles.
- **REQ-STREAK-2**: Each tile's color intensity reflects the number of activities checked that day (0 = grey, 1–2 = light green, 3–4 = medium green, 5+ = dark green).
- **REQ-STREAK-3**: Tapping a tile opens a day summary: fasting log, activities checked, water intake, and weight (if recorded that day).
- **REQ-STREAK-4**: Current consecutive-day streak is displayed prominently on the dashboard.

---

### 5. Water Intake Tracker

- **REQ-WATER-1**: User can log water intake in ml or oz (unit preference stored in profile).
- **REQ-WATER-2**: Daily water goal is configurable (default: 2000 ml).
- **REQ-WATER-3**: Progress bar shows how much of the daily goal has been reached.
- **REQ-WATER-4**: Quick-add buttons for common amounts (250 ml, 500 ml, 750 ml, 1 L).
- **REQ-WATER-5**: Daily totals are stored per day in Supabase.

---

### 6. Weight & Body Metrics

- **REQ-WEIGHT-1**: The app prompts the user to record their weight every 3 weeks via an in-app notification/modal.
- **REQ-WEIGHT-2**: User can also manually log weight at any time.
- **REQ-WEIGHT-3**: BMI is calculated automatically using stored height (set in profile) and latest weight.
- **REQ-WEIGHT-4**: A line chart shows weight over time on the dashboard.
- **REQ-WEIGHT-5**: Height, starting weight, and goal weight are set once in the user profile and editable any time.

---

### 7. Goal Tracker Dashboard

- **REQ-DASH-1**: Dashboard is the default authenticated view and displays:
  - Current fasting phase and countdown
  - Today's activity check-ins
  - Current streak count
  - Water intake progress
  - Latest weight and BMI
  - Progress toward goal weight (percentage and kg remaining)
  - AI suggestion card (see REQ-AI)
- **REQ-DASH-2**: All widgets are visible without scrolling on a 390 px (mobile) viewport, using a compact card layout.

---

### 8. AI Suggestions

- **REQ-AI-1**: Once per day (or on demand), the app generates a personalised suggestion using an open-source AI model via a free public API (e.g. Ollama-compatible endpoint or HuggingFace Inference API).
- **REQ-AI-2**: The suggestion is based on recent data: last 7 days of activity, fasting adherence, water intake, and weight trend.
- **REQ-AI-3**: Suggestions may include: recommended protocol changes, hydration tips, rest-day reminders, or motivational notes.
- **REQ-AI-4**: The suggestion is cached and displayed as a card on the dashboard; the user can manually refresh it.
- **REQ-AI-5**: No user data is sent to the AI provider beyond an anonymised summary (no PII).

---

### 9. PWA Requirements

- **REQ-PWA-1**: App is installable on iOS and Android via the browser's "Add to Home Screen" prompt.
- **REQ-PWA-2**: Core views (dashboard, fasting tracker, streak board) work offline using a service worker cache.
- **REQ-PWA-3**: App has a `manifest.json` with name, icons, theme colour, and `display: standalone`.
- **REQ-PWA-4**: Push notifications are supported for fasting window reminders (requires user permission).

---

### 10. Profile & Settings

- **REQ-PROF-1**: User stores: display name, height, starting weight, goal weight, preferred unit system (metric/imperial).
- **REQ-PROF-2**: User can delete all their data (GDPR-style right to erasure).
- **REQ-PROF-3**: User can sign out from the profile screen.

---

## Non-Functional Requirements

- **REQ-NF-1**: App must load and be interactive within 3 seconds on a 4G connection.
- **REQ-NF-2**: All Supabase calls use Row-Level Security (RLS) so users can only access their own data.
- **REQ-NF-3**: No secret keys are exposed in the frontend bundle; Supabase anon key usage only on the client.
- **REQ-NF-4**: UI must be usable with one hand on a phone — primary actions reachable with a thumb.
- **REQ-NF-5**: App supports light and dark mode (follows system preference via Tailwind's `dark:` variant).
