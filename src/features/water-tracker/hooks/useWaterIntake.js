import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../common/hooks/useSupabase'
import { useAuth } from '../../../common/context/AuthContext'
import { format } from 'date-fns'

const DEFAULT_GOAL_ML = 2500

/**
 * useWaterIntake
 *
 * Manages today's water intake stored as `water_ml` on the `daily_checkins`
 * row for today. Shares that row with useActivity, so writes are done as a
 * targeted UPDATE (when a row exists) or INSERT (when it doesn't) to avoid
 * clobbering the `activities` column.
 *
 * The daily goal has no DB column in the current schema, so it's persisted
 * per-user in localStorage.
 *
 * @returns {{
 *   waterMl: number,
 *   goalMl: number,
 *   unitSystem: 'metric'|'imperial',
 *   loading: boolean,
 *   error: string | null,
 *   addWater: (ml: number) => void,
 *   resetWater: () => void,
 *   setGoal: (ml: number) => void,
 * }}
 */
export function useWaterIntake() {
  const { user } = useAuth()
  const today = format(new Date(), 'yyyy-MM-dd')
  const goalKey = user ? `water_goal_${user.id}` : null

  const [waterMl, setWaterMl] = useState(0)
  const [goalMl, setGoalMl] = useState(DEFAULT_GOAL_ML)
  const [unitSystem, setUnitSystem] = useState('metric')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ── Load today's water + profile unit + saved goal ───────────────────────
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    // Restore saved goal
    const saved = goalKey ? localStorage.getItem(goalKey) : null
    if (saved) setGoalMl(parseInt(saved, 10) || DEFAULT_GOAL_ML)

    async function load() {
      setLoading(true)
      setError(null)

      const [checkinRes, profileRes] = await Promise.all([
        supabase
          .from('daily_checkins')
          .select('water_ml')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('unit_system')
          .eq('id', user.id)
          .maybeSingle(),
      ])

      if (checkinRes.error) {
        setError(checkinRes.error.message)
      } else if (checkinRes.data) {
        setWaterMl(checkinRes.data.water_ml ?? 0)
      }

      if (profileRes.data?.unit_system) {
        setUnitSystem(profileRes.data.unit_system)
      }

      setLoading(false)
    }

    load()
  }, [user, today, goalKey])

  // ── Persist a new water total (targeted, non-clobbering) ──────────────────
  const persist = useCallback(
    async (nextMl) => {
      if (!user) return

      // Does today's row already exist?
      const { data: existing } = await supabase
        .from('daily_checkins')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()

      if (existing) {
        const { error: updateError } = await supabase
          .from('daily_checkins')
          .update({ water_ml: nextMl })
          .eq('id', existing.id)
        if (updateError) setError(updateError.message)
      } else {
        const { error: insertError } = await supabase
          .from('daily_checkins')
          .insert({ user_id: user.id, date: today, water_ml: nextMl, activities: [] })
        if (insertError) setError(insertError.message)
      }
    },
    [user, today]
  )

  // ── Add water (optimistic) ────────────────────────────────────────────────
  const addWater = useCallback(
    (ml) => {
      setWaterMl((prev) => {
        const next = Math.max(0, prev + ml)
        persist(next)
        return next
      })
    },
    [persist]
  )

  // ── Reset today's water to zero ───────────────────────────────────────────
  const resetWater = useCallback(() => {
    setWaterMl(0)
    persist(0)
  }, [persist])

  // ── Update goal (localStorage only) ───────────────────────────────────────
  const setGoal = useCallback(
    (ml) => {
      const clamped = Math.max(250, Math.min(10000, Math.round(ml)))
      setGoalMl(clamped)
      if (goalKey) localStorage.setItem(goalKey, String(clamped))
    },
    [goalKey]
  )

  return {
    waterMl,
    goalMl,
    unitSystem,
    loading,
    error,
    addWater,
    resetWater,
    setGoal,
  }
}
