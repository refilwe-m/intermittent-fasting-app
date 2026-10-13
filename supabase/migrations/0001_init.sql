-- ============================================================================
-- Fasting App — initial schema (TASK-003)
-- Creates the five tables from design.md with Row Level Security.
-- Every table is scoped to the authenticated user via `user_id = auth.uid()`.
-- Safe to re-run: uses IF NOT EXISTS / idempotent policy drops.
-- ============================================================================

-- ── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  display_name        text,
  height_cm           numeric,
  starting_weight_kg  numeric,
  goal_weight_kg      numeric,
  unit_system         text default 'metric',  -- 'metric' | 'imperial'
  created_at          timestamptz not null default now()
);

-- ── fasting_sessions ─────────────────────────────────────────────────────────
create table if not exists public.fasting_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  protocol    text not null,                 -- 'omad' | '16:8' | '18:6' | '20:4' | 'custom'
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,                   -- null = active fast
  notes       text
);
create index if not exists fasting_sessions_user_started_idx
  on public.fasting_sessions (user_id, started_at desc);

-- ── daily_checkins ───────────────────────────────────────────────────────────
create table if not exists public.daily_checkins (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  date                date not null,
  activities          jsonb not null default '[]'::jsonb,  -- ["gym","fasted","custom:Yoga"]
  water_ml            integer not null default 0,
  fasting_session_id  uuid references public.fasting_sessions(id) on delete set null,
  unique (user_id, date)                      -- one row per user per day (matches upsert onConflict)
);
create index if not exists daily_checkins_user_date_idx
  on public.daily_checkins (user_id, date desc);

-- ── weight_logs ──────────────────────────────────────────────────────────────
create table if not exists public.weight_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  recorded_at   timestamptz not null default now(),
  weight_kg     numeric not null,
  bmi           numeric
);
create index if not exists weight_logs_user_recorded_idx
  on public.weight_logs (user_id, recorded_at desc);

-- ── ai_suggestions ───────────────────────────────────────────────────────────
create table if not exists public.ai_suggestions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  generated_at     timestamptz not null default now(),
  suggestion_text  text,
  context_summary  jsonb
);
create index if not exists ai_suggestions_user_generated_idx
  on public.ai_suggestions (user_id, generated_at desc);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles         enable row level security;
alter table public.fasting_sessions enable row level security;
alter table public.daily_checkins   enable row level security;
alter table public.weight_logs      enable row level security;
alter table public.ai_suggestions   enable row level security;

-- profiles: id is the user's auth id, so match on id
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- The remaining tables all key on user_id
drop policy if exists "own fasting_sessions" on public.fasting_sessions;
create policy "own fasting_sessions" on public.fasting_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own daily_checkins" on public.daily_checkins;
create policy "own daily_checkins" on public.daily_checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own weight_logs" on public.weight_logs;
create policy "own weight_logs" on public.weight_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own ai_suggestions" on public.ai_suggestions;
create policy "own ai_suggestions" on public.ai_suggestions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
