import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../../common/hooks/useSupabase'
import { useAuth } from '../../../common/context/AuthContext'
import {
  format,
  subDays,
  parseISO,
  differenceInHours,
  isSameDay,
} from 'date-fns'

const DAYS_BACK = 365

/**
 * useStreakData
 *
 * Loads the last 365 days of activity history for the GitHub-style streak
 * board and derives summary data per day.
 *
 * Data sources (all RLS-scoped to the current user):
 *  - daily_checkins   → activities[] + water_ml per date
 *  - fasting_sessions → to compute fasted hours per date
 *  - weight_logs      → weight logged on a given date (for the day modal)
 *
 * @returns {{
 *   dayMap: Record<string, {
 *     date: string,
 *     activities: string[],
 *     activityCount: number,
 *     waterMl: number,
 *     fastedHours: number,
 *     weightKg: number | null,
 *   }>,
 *   currentStreak: number,
 *   longestStreak: number,
 *   totalActiveDays: number,
 *   loading: boolean,
 *   error: string | null,
 * }}
 */
export function useStreakData() {
  const { user } = useAuth()

  const [checkins, setCheckins] = useState([])
  const [sessions, setSessions] = useState([])
  const [weights, setWeights] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function load() {
      setLoading(true)
      setError(null)

      const since = format(subDays(new Date(), DAYS_BACK), 'yyyy-MM-dd')
      const sinceTs = subDays(new Date(), DAYS_BACK).toISOString()

      const [checkinRes, sessionRes, weightRes] = await Promise.all([
        supabase
          .from('daily_checkins')
          .select('date, activities, water_ml')
          .eq('user_id', user.id)
          .gte('date', since),
        supabase
          .from('fasting_sessions')
          .select('started_at, ended_at')
          .eq('user_id', user.id)
          .gte('started_at', sinceTs),
        supabase
          .from('weight_logs')
          .select('recorded_at, weight_kg')
          .eq('user_id', user.id)
          .gte('recorded_at', sinceTs),
      ])

      const firstError =
        checkinRes.error || sessionRes.error || weightRes.error
      if (firstError) {
        setError(firstError.message)
        setLoading(false)
        return
      }

      setCheckins(checkinRes.data ?? [])
      setSessions(sessionRes.data ?? [])
      setWeights(weightRes.data ?? [])
      setLoading(false)
    }

    load()
  }, [user])

  // ── Build the per-day map ─────────────────────────────────────────────────
  const dayMap = useMemo(() => {
    const map = {}

    // Base layer: activity check-ins
    for (const row of checkins) {
      const activities = row.activities ?? []
      map[row.date] = {
        date: row.date,
        activities,
        activityCount: activities.length,
        waterMl: row.water_ml ?? 0,
        fastedHours: 0,
        weightKg: null,
      }
    }

    // Overlay fasted hours — attribute each session to its start date
    for (const s of sessions) {
      if (!s.started_at) continue
      const start = parseISO(s.started_at)
      const end = s.ended_at ? parseISO(s.ended_at) : new Date()
      const hours = Math.max(0, differenceInHours(end, start))
      const key = format(start, 'yyyy-MM-dd')
      if (!map[key]) {
        map[key] = {
          date: key,
          activities: [],
          activityCount: 0,
          waterMl: 0,
          fastedHours: 0,
          weightKg: null,
        }
      }
      map[key].fastedHours += hours
    }

    // Overlay weight — keep the latest reading on that date
    for (const w of weights) {
      if (!w.recorded_at) continue
      const key = format(parseISO(w.recorded_at), 'yyyy-MM-dd')
      if (!map[key]) {
        map[key] = {
          date: key,
          activities: [],
          activityCount: 0,
          waterMl: 0,
          fastedHours: 0,
          weightKg: null,
        }
      }
      map[key].weightKg = w.weight_kg
    }

    return map
  }, [checkins, sessions, weights])

  // ── Derive streak metrics ─────────────────────────────────────────────────
  const { currentStreak, longestStreak, totalActiveDays } = useMemo(() => {
    const isActive = (d) => (dayMap[format(d, 'yyyy-MM-dd')]?.activityCount ?? 0) > 0

    // Current streak: count back from today (allow today to be empty and
    // start from yesterday so the streak doesn't "break" before the day ends).
    let current = 0
    let cursor = new Date()
    if (!isActive(cursor)) cursor = subDays(cursor, 1)
    while (isActive(cursor)) {
      current += 1
      cursor = subDays(cursor, 1)
    }

    // Longest streak + total active days across the window.
    let longest = 0
    let running = 0
    let total = 0
    for (let i = DAYS_BACK; i >= 0; i--) {
      const d = subDays(new Date(), i)
      if (isActive(d)) {
        running += 1
        total += 1
        if (running > longest) longest = running
      } else {
        running = 0
      }
    }

    return { currentStreak: current, longestStreak: longest, totalActiveDays: total }
  }, [dayMap])

  return {
    dayMap,
    currentStreak,
    longestStreak,
    totalActiveDays,
    loading,
    error,
  }
}

/**
 * Maps an activity count to a tile color bucket (0–4), per design.md:
 *   0        → empty
 *   1–2      → light
 *   3–4      → medium
 *   5+       → dark
 * @param {number} count
 * @returns {0|1|2|3}
 */
export function activityLevel(count) {
  if (count >= 5) return 3
  if (count >= 3) return 2
  if (count >= 1) return 1
  return 0
}

export { isSameDay }
