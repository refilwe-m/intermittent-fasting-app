import { useMemo, useState } from 'react'
import { format, startOfWeek, addDays, subDays, isAfter, isSameMonth } from 'date-fns'
import { useStreakData } from './hooks/useStreakData'
import { StreakTile } from './StreakTile'
import { DaySummaryModal } from './DaySummaryModal'

const WEEKS = 53
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''] // show every other row

/**
 * Build a 53-week × 7-day matrix of dates ending on (and including) today.
 * Column 0 is the oldest week. Each column is a week starting Sunday.
 */
function buildWeeks() {
  const today = new Date()
  // The grid's last column is the week containing today.
  const lastWeekStart = startOfWeek(today, { weekStartsOn: 0 })
  const firstWeekStart = subDays(lastWeekStart, (WEEKS - 1) * 7)

  const weeks = []
  for (let w = 0; w < WEEKS; w++) {
    const weekStart = addDays(firstWeekStart, w * 7)
    const days = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(weekStart, d)
      days.push({
        date,
        dateString: format(date, 'yyyy-MM-dd'),
        isFuture: isAfter(date, today),
      })
    }
    weeks.push({ weekStart, days })
  }
  return weeks
}

/**
 * StreakBoard — GitHub-style contribution grid.
 *
 * Composes:
 *  - useStreakData  (TASK-019) → per-day map + streak metrics
 *  - StreakTile     (TASK-020) → individual colored cells
 *  - DaySummaryModal(TASK-021) → opens on tile tap
 */
export function StreakBoard() {
  const { dayMap, currentStreak, longestStreak, totalActiveDays, loading, error } =
    useStreakData()

  const weeks = useMemo(buildWeeks, [])
  const [selected, setSelected] = useState(null) // dateString

  // Month labels: show a label at the first week whose first day is in a new month
  const monthLabels = useMemo(() => {
    const labels = []
    let lastMonth = null
    weeks.forEach((week, i) => {
      const m = week.weekStart.getMonth()
      if (m !== lastMonth) {
        labels.push({ index: i, label: format(week.weekStart, 'MMM') })
        lastMonth = m
      } else {
        labels.push({ index: i, label: null })
      }
    })
    return labels
  }, [weeks])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        Loading your streak…
      </div>
    )
  }

  return (
    <div className="min-h-full bg-slate-950 px-4 py-6 space-y-6 max-w-sm mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Streaks</h1>
        <p className="text-slate-400 text-sm mt-0.5">Your activity over the last year</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-2">
        <Stat icon="🔥" value={currentStreak} label="Current" accent="text-orange-400" />
        <Stat icon="🏆" value={longestStreak} label="Longest" accent="text-amber-400" />
        <Stat icon="✅" value={totalActiveDays} label="Active days" accent="text-green-400" />
      </div>

      {/* Contribution grid (horizontal scroll on mobile) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-max">
            {/* Month labels */}
            <div className="flex gap-[3px] pl-7 mb-1">
              {monthLabels.map((m, i) => (
                <div key={i} className="w-3 text-[9px] text-slate-500 shrink-0">
                  {m.label ?? ''}
                </div>
              ))}
            </div>

            {/* Day-label column + week columns */}
            <div className="flex gap-[3px]">
              {/* Weekday labels */}
              <div className="flex flex-col gap-[3px] pr-1 justify-between">
                {DAY_LABELS.map((lbl, i) => (
                  <div key={i} className="h-3 text-[9px] text-slate-500 leading-3 w-6 text-right">
                    {lbl}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.days.map((cell) => (
                    <StreakTile
                      key={cell.dateString}
                      dateString={cell.dateString}
                      day={dayMap[cell.dateString] ?? null}
                      isFuture={cell.isFuture}
                      onSelect={setSelected}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-slate-500">
          <span>Less</span>
          <span className="w-3 h-3 rounded-sm bg-slate-800" />
          <span className="w-3 h-3 rounded-sm bg-green-900" />
          <span className="w-3 h-3 rounded-sm bg-green-700" />
          <span className="w-3 h-3 rounded-sm bg-green-500" />
          <span>More</span>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-red-400 text-xs text-center">
          {error}
        </p>
      )}

      {/* Day summary modal */}
      {selected && (
        <DaySummaryModal
          dateString={selected}
          day={dayMap[selected] ?? null}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

function Stat({ icon, value, label, accent }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
      <div className="text-lg" aria-hidden="true">{icon}</div>
      <div className={['text-xl font-bold mt-0.5', accent].join(' ')}>{value}</div>
      <div className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</div>
    </div>
  )
}
