import { useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { DEFAULT_ACTIVITIES } from '../activity/ActivityCheckin'

// Lookup for pretty labels + icons of the default activities
const ACTIVITY_META = Object.fromEntries(
  DEFAULT_ACTIVITIES.map((a) => [a.id, a])
)

function prettyActivity(id) {
  if (id.startsWith('custom:')) {
    return { icon: '✨', label: id.replace('custom:', '') }
  }
  const meta = ACTIVITY_META[id]
  return meta ? { icon: meta.icon, label: meta.label } : { icon: '•', label: id }
}

/**
 * DaySummaryModal
 *
 * Bottom-sheet modal shown when a streak tile is tapped. Displays everything
 * recorded on that date: activities, water, fasted hours, weight.
 *
 * @param {{
 *   day: {
 *     date: string,
 *     activities: string[],
 *     activityCount: number,
 *     waterMl: number,
 *     fastedHours: number,
 *     weightKg: number | null,
 *   } | null,
 *   dateString: string,
 *   onClose: () => void,
 * }} props
 */
export function DaySummaryModal({ day, dateString, onClose }) {
  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!dateString) return null

  const prettyDate = format(parseISO(dateString), 'EEEE, d MMMM yyyy')
  const activities = day?.activities ?? []
  const hasData =
    activities.length > 0 ||
    (day?.waterMl ?? 0) > 0 ||
    (day?.fastedHours ?? 0) > 0 ||
    day?.weightKg != null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Summary for ${prettyDate}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-sm bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 animate-[slideUp_0.2s_ease-out]">
        {/* Grab handle (mobile) */}
        <div className="sm:hidden mx-auto w-10 h-1 rounded-full bg-slate-700" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">{prettyDate}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {activities.length > 0
                ? `${activities.length} ${activities.length === 1 ? 'activity' : 'activities'}`
                : 'No activities logged'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!hasData ? (
          <p className="text-sm text-slate-500 py-6 text-center">
            Nothing was recorded on this day.
          </p>
        ) : (
          <>
            {/* Activities */}
            {activities.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Activities
                </p>
                <div className="flex flex-wrap gap-2">
                  {activities.map((id) => {
                    const { icon, label } = prettyActivity(id)
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 bg-green-600/15 border border-green-500/30 text-green-300 text-xs font-medium rounded-full px-3 py-1.5"
                      >
                        <span aria-hidden="true">{icon}</span>
                        {label}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Metrics grid */}
            <div className="grid grid-cols-3 gap-2">
              <Metric
                icon="💧"
                label="Water"
                value={day.waterMl > 0 ? `${(day.waterMl / 1000).toFixed(1)} L` : '—'}
              />
              <Metric
                icon="⏱️"
                label="Fasted"
                value={day.fastedHours > 0 ? `${Math.round(day.fastedHours)} h` : '—'}
              />
              <Metric
                icon="⚖️"
                label="Weight"
                value={day.weightKg != null ? `${day.weightKg} kg` : '—'}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Metric({ icon, label, value }) {
  return (
    <div className="bg-slate-800 rounded-xl p-3 text-center">
      <div className="text-lg" aria-hidden="true">{icon}</div>
      <div className="text-sm font-semibold text-white mt-1">{value}</div>
      <div className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</div>
    </div>
  )
}
