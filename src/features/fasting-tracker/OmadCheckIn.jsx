import { useState } from 'react'

/**
 * OmadCheckIn
 *
 * For OMAD users — a single prominent "I just ate" button.
 * On tap: ends the current session and immediately starts a new 23-hour fast.
 *
 * @param {{
 *   onCheckIn: () => Promise<void>,
 *   activeSession: object|null,
 *   elapsedSeconds: number,
 * }} props
 */
export function OmadCheckIn({ onCheckIn, activeSession, elapsedSeconds }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  const elapsedHours = Math.floor(elapsedSeconds / 3600)
  const elapsedMins  = Math.floor((elapsedSeconds % 3600) / 60)
  const elapsedText  = `${elapsedHours}h ${String(elapsedMins).padStart(2, '0')}m`

  async function handleConfirm() {
    setLoading(true)
    await onCheckIn()
    setLoading(false)
    setConfirming(false)
  }

  if (confirming) {
    return (
      <div className="bg-slate-800 border border-amber-500/40 rounded-2xl p-5 space-y-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-white">Log your meal?</p>
          <p className="text-sm text-slate-400 mt-1">
            This will end your current fast ({elapsedText} elapsed) and start a fresh 23-hour fast.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-xl py-3 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            {loading ? 'Logging…' : '✓ Yes, I ate'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className={[
        'w-full rounded-2xl py-5 text-center border transition-all',
        'focus:outline-none focus:ring-2 focus:ring-green-500',
        activeSession
          ? 'bg-green-600/10 border-green-500/30 hover:bg-green-600/20 active:scale-[0.98]'
          : 'bg-slate-800 border-slate-700 cursor-default opacity-60',
      ].join(' ')}
      aria-label="Log that I just ate"
      disabled={!activeSession}
    >
      <span className="text-3xl block mb-1">🍴</span>
      <span className="block text-white font-bold text-base">I just ate</span>
      <span className="block text-slate-400 text-xs mt-0.5">
        {activeSession
          ? `Ends fast · starts new 23h window`
          : 'Start a fast first'}
      </span>
    </button>
  )
}
