import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../common/hooks/useSupabase'
import { useAuth } from '../../common/context/AuthContext'
import { format, subDays, parseISO, isSameDay } from 'date-fns'
import { buildAiPrompt } from './aiPromptBuilder'
import { generateSuggestion } from './aiClient'

/**
 * useAiSuggestion
 *
 * Loads today's cached AI suggestion (if any) and exposes refresh() to
 * generate a new one. Generation:
 *   1. aggregates the last 7 days of anonymous data
 *   2. builds a PII-free prompt
 *   3. calls the AI client
 *   4. caches the result in `ai_suggestions`
 *
 * @returns {{
 *   suggestion: string | null,
 *   generatedAt: string | null,
 *   loading: boolean,     // initial cache load
 *   generating: boolean,  // live generation in-flight
 *   error: string | null,
 *   refresh: () => Promise<void>,
 *   isToday: boolean,
 * }}
 */
export function useAiSuggestion() {
  const { user } = useAuth()

  const [suggestion, setSuggestion] = useState(null)
  const [generatedAt, setGeneratedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  // ── Load the most recent cached suggestion ────────────────────────────────
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function load() {
      setLoading(true)
      const { data, error: loadError } = await supabase
        .from('ai_suggestions')
        .select('suggestion_text, generated_at')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (loadError) setError(loadError.message)
      else if (data) {
        setSuggestion(data.suggestion_text)
        setGeneratedAt(data.generated_at)
      }
      setLoading(false)
    }

    load()
  }, [user])

  // ── Aggregate the last 7 days into an anonymous summary ───────────────────
  const buildSummary = useCallback(async () => {
    const since = subDays(new Date(), 7)
    const sinceDate = format(since, 'yyyy-MM-dd')
    const sinceTs = since.toISOString()

    const [checkinsRes, sessionsRes, weightsRes] = await Promise.all([
      supabase
        .from('daily_checkins')
        .select('date, activities, water_ml')
        .eq('user_id', user.id)
        .gte('date', sinceDate),
      supabase
        .from('fasting_sessions')
        .select('started_at, ended_at')
        .eq('user_id', user.id)
        .gte('started_at', sinceTs),
      supabase
        .from('weight_logs')
        .select('recorded_at, weight_kg')
        .eq('user_id', user.id)
        .gte('recorded_at', sinceTs)
        .order('recorded_at', { ascending: true }),
    ])

    const checkins = checkinsRes.data ?? []
    const sessions = sessionsRes.data ?? []
    const weights = weightsRes.data ?? []

    // Activity counts (strip custom: prefix to a generic 'other')
    const lastWeekActivities = {}
    for (const row of checkins) {
      for (const a of row.activities ?? []) {
        const key = a.startsWith('custom:') ? 'other' : a
        lastWeekActivities[key] = (lastWeekActivities[key] ?? 0) + 1
      }
    }

    // Fasting adherence = distinct days with a session started
    const fastedDays = new Set(
      sessions.map((s) => format(parseISO(s.started_at), 'yyyy-MM-dd'))
    )
    const fastingAdherenceDays = fastedDays.size

    // Average water across days that have a check-in
    const waterValues = checkins.map((c) => c.water_ml ?? 0).filter((v) => v > 0)
    const avgWaterMl =
      waterValues.length > 0
        ? waterValues.reduce((a, b) => a + b, 0) / waterValues.length
        : 0

    // Weight delta over the window
    let weightDeltaKg = null
    if (weights.length >= 2) {
      weightDeltaKg = weights[weights.length - 1].weight_kg - weights[0].weight_kg
      weightDeltaKg = Math.round(weightDeltaKg * 10) / 10
    }

    return { lastWeekActivities, fastingAdherenceDays, avgWaterMl, weightDeltaKg }
  }, [user])

  // ── Generate a fresh suggestion + cache it ────────────────────────────────
  const refresh = useCallback(async () => {
    if (!user || generating) return
    setGenerating(true)
    setError(null)

    try {
      const summary = await buildSummary()
      const prompt = buildAiPrompt(summary)
      const text = await generateSuggestion(prompt)

      const generated_at = new Date().toISOString()
      const { error: insertError } = await supabase.from('ai_suggestions').insert({
        user_id: user.id,
        generated_at,
        suggestion_text: text,
        context_summary: summary, // anonymous aggregate — safe to store
      })
      if (insertError) throw new Error(insertError.message)

      setSuggestion(text)
      setGeneratedAt(generated_at)
    } catch (e) {
      setError(e.message || 'Could not generate a suggestion.')
    } finally {
      setGenerating(false)
    }
  }, [user, generating, buildSummary])

  const isToday = generatedAt
    ? isSameDay(parseISO(generatedAt), new Date())
    : false

  return {
    suggestion,
    generatedAt,
    loading,
    generating,
    error,
    refresh,
    isToday,
  }
}
