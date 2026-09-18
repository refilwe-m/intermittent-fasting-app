import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../../common/hooks/useSupabase'
import { useAuth } from '../../../common/context/AuthContext'
import { getFastingState } from '../../../common/utils/fastingState'

/**
 * useFastingSession
 *
 * Manages the active fasting session lifecycle:
 *  - Loads any in-progress session on mount
 *  - Ticks elapsed time every second
 *  - Exposes startFast / endFast actions
 *
 * @returns {{
 *   activeSession: object|null,
 *   elapsedSeconds: number,
 *   elapsedHours: number,
 *   fastingState: object,
 *   loading: boolean,
 *   error: string|null,
 *   startFast: (protocol: string, startedAt?: Date) => Promise<void>,
 *   endFast: () => Promise<void>,
 * }}
 */
export function useFastingSession() {
  const { user } = useAuth()
  const [activeSession, setActiveSession] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const tickRef = useRef(null)

  // ── Compute elapsed from session start ──────────────────────────────────
  function computeElapsed(session) {
    if (!session) return 0
    return Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000)
  }

  // ── Start the 1-second ticker ────────────────────────────────────────────
  function startTicker(session) {
    clearInterval(tickRef.current)
    tickRef.current = setInterval(() => {
      setElapsedSeconds(computeElapsed(session))
    }, 1000)
  }

  // ── Load active session on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function loadSession() {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('fasting_sessions')
        .select('*')
        .eq('user_id', user.id)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fetchError) {
        setError(fetchError.message)
      } else if (data) {
        setActiveSession(data)
        setElapsedSeconds(computeElapsed(data))
        startTicker(data)
      }
      setLoading(false)
    }

    loadSession()

    return () => clearInterval(tickRef.current)
  }, [user])

  // ── startFast ─────────────────────────────────────────────────────────────
  const startFast = useCallback(
    async (protocol, startedAt = new Date()) => {
      if (!user) return
      setError(null)

      // End any existing active session first
      if (activeSession) {
        await supabase
          .from('fasting_sessions')
          .update({ ended_at: new Date().toISOString() })
          .eq('id', activeSession.id)
      }

      const { data, error: insertError } = await supabase
        .from('fasting_sessions')
        .insert({
          user_id: user.id,
          protocol,
          started_at: startedAt.toISOString(),
        })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        return
      }

      setActiveSession(data)
      setElapsedSeconds(computeElapsed(data))
      startTicker(data)
    },
    [user, activeSession]
  )

  // ── endFast ───────────────────────────────────────────────────────────────
  const endFast = useCallback(async () => {
    if (!activeSession) return
    setError(null)

    const { error: updateError } = await supabase
      .from('fasting_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', activeSession.id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    clearInterval(tickRef.current)
    setActiveSession(null)
    setElapsedSeconds(0)
  }, [activeSession])

  const elapsedHours = elapsedSeconds / 3600
  const fastingState = getFastingState(elapsedHours)

  return {
    activeSession,
    elapsedSeconds,
    elapsedHours,
    fastingState,
    loading,
    error,
    startFast,
    endFast,
  }
}
