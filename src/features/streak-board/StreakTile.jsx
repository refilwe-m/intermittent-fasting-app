import { activityLevel } from './hooks/useStreakData'

/**
 * Tailwind classes per activity level (design.md color language):
 *   0  → slate (empty)
 *   1  → green-200/900  (1–2 activities)
 *   2  → green-400/700  (3–4 activities)
 *   3  → green-600/500  (5+ activities)
 *
 * NOTE: these class strings are written out in full so Tailwind's JIT
 * scanner picks them up (it can't see dynamically-built class names).
 */
const LEVEL_CLASSES = [
  'bg-slate-800 hover:bg-slate-700',
  'bg-green-900 hover:bg-green-800',
  'bg-green-700 hover:bg-green-600',
  'bg-green-500 hover:bg-green-400',
]

/**
 * StreakTile — a single day cell in the contribution grid.
 *
 * @param {{
 *   day: {
 *     date: string,
 *     activityCount: number,
 *   } | null,                 // null = padding cell (before range / future)
 *   dateString: string,       // yyyy-MM-dd this cell represents
 *   isFuture?: boolean,
 *   onSelect?: (dateString: string) => void,
 * }} props
 */
export function StreakTile({ day, dateString, isFuture = false, onSelect }) {
  const count = day?.activityCount ?? 0
  const level = activityLevel(count)

  // Future days are rendered faint and non-interactive
  if (isFuture) {
    return (
      <div
        className="w-3 h-3 rounded-sm bg-slate-900/50"
        aria-hidden="true"
      />
    )
  }

  const label =
    count === 0
      ? `${dateString}: no activity`
      : `${dateString}: ${count} ${count === 1 ? 'activity' : 'activities'}`

  return (
    <button
      type="button"
      onClick={() => onSelect?.(dateString)}
      title={label}
      aria-label={label}
      className={[
        'w-3 h-3 rounded-sm transition-colors cursor-pointer',
        'focus:outline-none focus:ring-1 focus:ring-blue-400 focus:ring-offset-1 focus:ring-offset-slate-950',
        LEVEL_CLASSES[level],
      ].join(' ')}
    />
  )
}
