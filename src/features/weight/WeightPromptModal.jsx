import { useState, useEffect } from 'react'
import { differenceInDays, parseISO } from 'date-fns'
import { supabase } from '../../common/hooks/useSupabase'
import { useAuth } from '../../common/context/AuthContext'

const PROMPT_AFTER_DAYS = 21
const SNOOZE_DAYS = 3

/**
 * WeightPromptModal
 *
 * Mounted once in the authenticated app shell. On load it checks whether the
 * user's most recent weight log is >= 21 days old (or missing). If so — and
 * the user hasn't snoozed recently — it shows a non-blocking bottom sheet.
 *
 * "Log now"        → navigate to /weight (via onLogNow)
 * "Remind me later"→ snooze 3 days (localStorage)
 *
 * @param {{ onLogNow: () => void }} props
 */
export function WeightPromptModal({ onLogNow }) {
  const { user } = useAuth()
  const [show, setShow] = useState(false)

  const snoozeKey = user ? `weight_prompt_snooze_${user.id}` : null

  useEffect(() => {
    if (!user) return

    async function check() {
      // Respect an active snooze
      const snoozedUntil = snoozeKey ? localStorage.getItem(snoozeKey) : null
      if (snoozedUntil && new Date(snoozedUntil) > new Date()) return

      const { data, error } = await supabase
        .from('weight_logs')
        .select('recorded_at')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) return // fail silently — prompt is non-critical

      const needsPrompt =
        !data ||
        differenceInDays(new Date(), parseISO(data.recorded_at)) >= PROMPT_AFTER_DAYS

      if (needsPrompt) setShow(true)
    }

    check()
  }, [user, snoozeKey])

  function snooze() {
    if (snoozeKey) {
      const until = new Date()
      until.setDate(until.getDate() + SNOOZE_DAYS)
      localStorage.setItem(snoozeKey, until.toISOString())
    }
    setShow(false)
  }

  function logNow() {
    setShow(false)
    onLogNow?.()
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center sm:justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={snooze}
        aria-hidden="true"
      />
      <div
        className="relative w-full sm:max-w-sm bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-3xl p-6 space-y-4 animate-[slideUp_0.2s_ease-out]"
        role="dialog"
        aria-modal="true"
        aria-label="Time to log your weight"
      >
        <div className="sm:hidden mx-auto w-10 h-1 rounded-full bg-slate-700" />
        <div className="text-center">
          <div className="text-4xl mb-2">⚖️</div>
          <h2 className="text-lg font-bold text-white">Time for a weigh-in</h2>
          <p className="text-slate-400 text-sm mt-1">
            It's been a few weeks. Logging your weight keeps your progress chart accurate.
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={logNow}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl py-3.5 text-sm transition-colors"
          >
            Log now
          </button>
          <button
            type="button"
            onClick={snooze}
            className="w-full text-slate-400 hover:text-slate-200 font-medium py-2.5 text-sm transition-colors"
          >
            Remind me later
          </button>
        </div>
      </div>
    </div>
  )
}
