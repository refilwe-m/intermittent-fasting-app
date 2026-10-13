import { useState, useEffect } from 'react'
import { supabase } from '../../../common/hooks/useSupabase'
import { useAuth } from '../../../common/context/AuthContext'
import {
  format,
  subDays,
  parseISO,
  differenceInSeconds,
} from 'date-fns'
import { getFastingState } from '../../../common/utils/fastingState'
import { calculateBmi } from '../../../common/utils/bmi'

/**
 * useDashboardData
 *
 * Single hook that parallel-fetches everything the dashboard widgets need in
 * one round of requests (Promise.all), then shapes it into one object.
 *
 * @returns {{
 *   fasting: { active: boolean, elapsedSeconds: number, stateLabel: string, stateIcon: string } | null,
 *   streak: { current: number, todayCount: number },
 *   water: { ml: number },
 *   weight: { latestKg: number|null, bmi: number|null, progressPercent: number|null },
 *   aiSuggestion: { text: string|null, generatedAt: string|null },
 *   profile: object | null,
 *   loading: boolean,
 *   error: string | null,
 * }}
 */
export function useDashboardData() {
  const { user } = useAuth()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [data, setData] = useState({
    fasting: null,
    streak: { current: 0, todayCount: 0 },
    water: { ml: 0 },
    weight: { latestKg: null, bmi: null, progressPercent: null },
    aiSuggestion: { text: null, generatedAt: null },
    profile: null,
  })
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

      const since = format(subDays(new Date(), 60), 'yyyy-MM-dd')

      const [
        activeFastRes,
        checkinsRes,
        weightRes,
        profileRes,
        aiRes,
      ] = await Promise.all([
        // Active fasting session (no ended_at)
        supabase
          .from('fasting_sessions')
          .select('protocol, started_at')
          .eq('user_id', user.id)
          .is('ended_at', null)
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        // Recent check-ins for streak + today's water/activities
        supabase
          .from('daily_checkins')
          .select('date, activities, water_ml')
          .eq('user_id', user.id)
          .gte('date', since)
          .order('date', { ascending: false }),
        // Latest weight
        supabase
          .from('weight_logs')
          .select('weight_kg, bmi')
          .eq('user_id', user.id)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        // Profile targets
        supabase
          .from('profiles')
          .select('display_name, height_cm, starting_weight_kg, goal_weight_kg, unit_system')
          .eq('id', user.id)
          .maybeSingle(),
        // Latest AI suggestion
        supabase
          .from('ai_suggestions')
          .select('suggestion_text, generated_at')
          .eq('user_id', user.id)
          .order('generated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      // Surface the first hard error (ignore maybeSingle "no rows")
      const firstError =
        activeFastRes.error ||
        checkinsRes.error ||
        weightRes.error ||
        profileRes.error ||
        aiRes.error
      if (firstError) {
        setError(firstError.message)
        setLoading(false)
        return
      }

      // ── Fasting ──
      let fasting = null
      if (activeFastRes.data) {
        const elapsedSeconds = Math.max(
          0,
          differenceInSeconds(new Date(), parseISO(activeFastRes.data.started_at))
        )
        const state = getFastingState(elapsedSeconds / 3600)
        fasting = {
          active: true,
          elapsedSeconds,
          stateLabel: state.label,
          stateIcon: state.icon,
        }
      }

      // ── Streak + today's water ──
      const checkins = checkinsRes.data ?? []
      const byDate = Object.fromEntries(checkins.map((c) => [c.date, c]))

      const todayRow = byDate[today]
      const todayCount = (todayRow?.activities ?? []).length
      const waterMl = todayRow?.water_ml ?? 0

      // Current streak: count back from today (or yesterday if today empty)
      const isActive = (d) =>
        ((byDate[format(d, 'yyyy-MM-dd')]?.activities ?? []).length) > 0
      let current = 0
      let cursor = new Date()
      if (!isActive(cursor)) cursor = subDays(cursor, 1)
      while (isActive(cursor)) {
        current += 1
        cursor = subDays(cursor, 1)
      }

      // ── Weight ──
      const profile = profileRes.data ?? null
      const latestKg = weightRes.data?.weight_kg ?? null
      const bmi =
        weightRes.data?.bmi ?? calculateBmi(latestKg, profile?.height_cm)

      let progressPercent = null
      const start = profile?.starting_weight_kg
      const goal = profile?.goal_weight_kg
      if (start != null && goal != null && start !== goal && latestKg != null) {
        const pct = ((start - latestKg) / (start - goal)) * 100
        progressPercent = Math.max(0, Math.min(100, Math.round(pct)))
      }

      setData({
        fasting,
        streak: { current, todayCount },
        water: { ml: waterMl },
        weight: { latestKg, bmi, progressPercent },
        aiSuggestion: {
          text: aiRes.data?.suggestion_text ?? null,
          generatedAt: aiRes.data?.generated_at ?? null,
        },
        profile,
      })
      setLoading(false)
    }

    load()
  }, [user, today])

  return { ...data, loading, error }
}
