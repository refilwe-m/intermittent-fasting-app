import { useActivity } from './hooks/useActivity'
import { ActivityCheckin, DEFAULT_ACTIVITIES } from './ActivityCheckin'
import { CustomActivityInput } from './CustomActivityInput'
import { format } from 'date-fns'

/**
 * ActivityPage
 *
 * Daily activity check-in page (/activity).
 *
 * Composes:
 *  - ActivityCheckin      — the 5 default activity toggles (TASK-016)
 *  - CustomActivityInput  — add/remove one-off custom activities (TASK-017)
 *
 * All state + persistence is handled by the useActivity hook (TASK-018),
 * which upserts today's `daily_checkins` row optimistically.
 */
export function ActivityPage() {
  const {
    activities,
    loading,
    error,
    toggleActivity,
    addCustomActivity,
    removeActivity,
    customHistory,
  } = useActivity()

  const today = format(new Date(), 'EEEE, d MMMM')

  // Count of everything the user has logged today (defaults + customs)
  const loggedCount = activities.length
  const defaultLogged = DEFAULT_ACTIVITIES.filter((a) =>
    activities.includes(a.id)
  ).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        Loading today's check-in…
      </div>
    )
  }

  return (
    <div className="min-h-full bg-slate-950 px-4 py-6 space-y-6 max-w-sm mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Daily Check-in</h1>
        <p className="text-slate-400 text-sm mt-0.5">{today}</p>
      </div>

      {/* Summary pill */}
      <div
        className={[
          'rounded-2xl p-4 flex items-center gap-3 border',
          loggedCount > 0
            ? 'bg-green-600/10 border-green-500/30'
            : 'bg-slate-900 border-slate-800',
        ].join(' ')}
      >
        <span className="text-2xl" aria-hidden="true">
          {loggedCount > 0 ? '🔥' : '📋'}
        </span>
        <div>
          <p className="text-sm font-semibold text-white">
            {loggedCount > 0
              ? `${loggedCount} ${loggedCount === 1 ? 'activity' : 'activities'} logged`
              : 'Nothing logged yet'}
          </p>
          <p className="text-xs text-slate-400">
            {loggedCount > 0
              ? 'Nice work — keep the streak going.'
              : 'Check off what you did today to keep your streak.'}
          </p>
        </div>
      </div>

      {/* Default activities */}
      <section className="space-y-3">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Activities {defaultLogged > 0 && (
            <span className="text-green-400">· {defaultLogged}/{DEFAULT_ACTIVITIES.length}</span>
          )}
        </p>
        <ActivityCheckin activities={activities} onToggle={toggleActivity} />
      </section>

      {/* Custom activities */}
      <section>
        <CustomActivityInput
          activities={activities}
          customHistory={customHistory}
          onAdd={addCustomActivity}
          onRemove={removeActivity}
        />
      </section>

      {/* Error display */}
      {error && (
        <p role="alert" className="text-red-400 text-xs text-center">
          {error}
        </p>
      )}
    </div>
  )
}
