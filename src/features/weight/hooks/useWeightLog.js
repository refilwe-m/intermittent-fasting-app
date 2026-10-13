import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../../../common/hooks/useSupabase'
import { useAuth } from '../../../common/context/AuthContext'
import { calculateBmi } from '../../../common/utils/bmi'

/**
 * useWeightLog
 *
 * Loads the user's full weight history + profile targets, exposes logWeight()
 * (inserts a row with computed BMI), and derives summary metrics.
 *
 * @returns {{
 *   logs: { recorded_at: string, weight_kg: number, bmi: number|null }[],
 *   profile: object | null,
 *   latestWeight: number | null,
 *   bmi: number | null,
 *   progressPercent: number | null,   // 0–100 toward goal
 *   unitSystem: 'metric'|'imperial',
 *   loading: boolean,
 *   saving: boolean,
 *   error: string | null,
 *   logWeight: (kg: number) => Promise<boolean>,
 * }}
 */
export function useWeightLog() {
  const { user } = useAuth()

  const [logs, setLogs] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // ── Load logs + profile ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function load() {
      setLoading(true)
      setError(null)

      const [logRes, profileRes] = await Promise.all([
        supabase
          .from('weight_logs')
          .select('recorded_at, weight_kg, bmi')
          .eq('user_id', user.id)
          .order('recorded_at', { ascending: true }),
        supabase
          .from('profiles')
          .select('height_cm, starting_weight_kg, goal_weight_kg, unit_system')
          .eq('id', user.id)
          .maybeSingle(),
      ])

      if (logRes.error) setError(logRes.error.message)
      else setLogs(logRes.data ?? [])

      if (profileRes.data) setProfile(profileRes.data)

      setLoading(false)
    }

    load()
  }, [user])

  // ── Log a new weight (inserts with computed BMI) ──────────────────────────
  const logWeight = useCallback(
    async (kg) => {
      if (!user || !kg) return false
      setSaving(true)
      setError(null)

      const bmi = calculateBmi(kg, profile?.height_cm)
      const row = {
        user_id: user.id,
        recorded_at: new Date().toISOString(),
        weight_kg: kg,
        bmi,
      }

      const { data, error: insertError } = await supabase
        .from('weight_logs')
        .insert(row)
        .select('recorded_at, weight_kg, bmi')
        .single()

      setSaving(false)

      if (insertError) {
        setError(insertError.message)
        return false
      }

      // Append optimistically (list is ascending by date)
      setLogs((prev) => [...prev, data])
      return true
    },
    [user, profile?.height_cm]
  )

  // ── Derived metrics ───────────────────────────────────────────────────────
  const { latestWeight, bmi, progressPercent } = useMemo(() => {
    const latest = logs.length ? logs[logs.length - 1] : null
    const latestKg = latest?.weight_kg ?? null

    const latestBmi =
      latest?.bmi ?? calculateBmi(latestKg, profile?.height_cm)

    // Progress from starting weight → goal weight.
    let progress = null
    const start = profile?.starting_weight_kg
    const goal = profile?.goal_weight_kg
    if (start != null && goal != null && start !== goal && latestKg != null) {
      const pct = ((start - latestKg) / (start - goal)) * 100
      progress = Math.max(0, Math.min(100, Math.round(pct)))
    }

    return { latestWeight: latestKg, bmi: latestBmi, progressPercent: progress }
  }, [logs, profile])

  return {
    logs,
    profile,
    latestWeight,
    bmi,
    progressPercent,
    unitSystem: profile?.unit_system ?? 'metric',
    loading,
    saving,
    error,
    logWeight,
  }
}
