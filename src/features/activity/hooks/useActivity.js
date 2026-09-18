import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../common/hooks/useSupabase'
import { useAuth } from '../../../common/context/AuthContext'
import { format } from 'date-fns'

/**
 * useActivity
 *
 * Manages today's activity check-in against the `daily_checkins` table.
 *
 * Strategy:
 *  - On mount, load today's row (if any).
 *  - toggleActivity / addCustomActivity update local state immediately
 *    (optimistic) then upsert to Supabase in the background.
 *  - Upserts use `onConflict: 'user_id,date'` so we always keep a single
 *    row per user per day.
 *
 * @returns {{
 *   activities: string[],
 *   loading: boolean,
 *   error: string | null,
 *   toggleActivity: (activityId: string) => void,
 *   addCustomActivity: (label: string) => void,
 *   removeActivity: (activityId: string) => void,
 *   customHistory: string[],
 * }}
 */
export function useActivity() {
  const { user } = useAuth()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [activities, setActivities] = useState([])
  const [customHistory, setCustomHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ── Load today's check-in on mount ───────────────────────────────────────
  useEffect(() => {
    if (!user) { setLoading(false); return }

    async function load() {
      setLoading(true)

      const { data, error: fetchError } = await supabase
        .from('daily_checkins')
        .select('activities')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()

      if (fetchError) {
        setError(fetchError.message)
      } else if (data?.activities) {
        setActivities(data.activities)
      }

      // Also pull custom activity labels from recent history (last 30 days)
      const { data: history } = await supabase
        .from('daily_checkins')
        .select('activities')
        .eq('user_id', user.id)
        .gte('date', format(new Date(Date.now() - 30 * 86400 * 1000), 'yyyy-MM-dd'))
        .order('date', { ascending: false })

      if (history) {
        const customs = history
          .flatMap((row) => row.activities ?? [])
          .filter((a) => a.startsWith('custom:'))
          .map((a) => a.replace('custom:', ''))
        // Deduplicate and keep last 10 unique
        setCustomHistory([...new Set(customs)].slice(0, 10))
      }

      setLoading(false)
    }

    load()
  }, [user, today])

  // ── Persist to Supabase ──────────────────────────────────────────────────
  const persist = useCallback(
    async (nextActivities) => {
      if (!user) return

      const { error: upsertError } = await supabase
        .from('daily_checkins')
        .upsert(
          { user_id: user.id, date: today, activities: nextActivities },
          { onConflict: 'user_id,date' }
        )

      if (upsertError) setError(upsertError.message)
    },
    [user, today]
  )

  // ── Toggle a default activity on/off ────────────────────────────────────
  const toggleActivity = useCallback(
    (activityId) => {
      setActivities((prev) => {
        const next = prev.includes(activityId)
          ? prev.filter((a) => a !== activityId)
          : [...prev, activityId]
        persist(next)
        return next
      })
    },
    [persist]
  )

  // ── Add a custom activity label ──────────────────────────────────────────
  const addCustomActivity = useCallback(
    (label) => {
      const key = `custom:${label.trim()}`
      setActivities((prev) => {
        if (prev.includes(key)) return prev
        const next = [...prev, key]
        persist(next)
        return next
      })
      // Add to history chips if not already there
      setCustomHistory((prev) =>
        prev.includes(label.trim()) ? prev : [label.trim(), ...prev].slice(0, 10)
      )
    },
    [persist]
  )

  // ── Remove any activity ──────────────────────────────────────────────────
  const removeActivity = useCallback(
    (activityId) => {
      setActivities((prev) => {
        const next = prev.filter((a) => a !== activityId)
        persist(next)
        return next
      })
    },
    [persist]
  )

  return {
    activities,
    loading,
    error,
    toggleActivity,
    addCustomActivity,
    removeActivity,
    customHistory,
  }
}
