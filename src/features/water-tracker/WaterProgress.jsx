import { formatWater } from '../../common/utils/units'

/**
 * Pick a bar color based on how close we are to the goal.
 * Full class strings so Tailwind's JIT scanner keeps them.
 */
function barColor(pct) {
  if (pct >= 100) return 'bg-sky-600'
  if (pct >= 66) return 'bg-sky-500'
  if (pct >= 33) return 'bg-sky-400'
  return 'bg-sky-300'
}

/**
 * WaterProgress — animated horizontal progress bar toward the daily goal.
 *
 * @param {{
 *   waterMl: number,
 *   goalMl: number,
 *   unitSystem: 'metric'|'imperial',
 * }} props
 */
export function WaterProgress({ waterMl, goalMl, unitSystem }) {
  const pct = goalMl > 0 ? Math.min(100, (waterMl / goalMl) * 100) : 0
  const reached = waterMl >= goalMl

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between">
        <div>
          <span className="text-3xl font-bold text-white">
            {formatWater(waterMl, unitSystem)}
          </span>
          <span className="text-slate-400 text-sm ml-2">
            / {formatWater(goalMl, unitSystem)}
          </span>
        </div>
        <span
          className={[
            'text-sm font-semibold',
            reached ? 'text-sky-400' : 'text-slate-400',
          ].join(' ')}
        >
          {Math.round(pct)}%
        </span>
      </div>

      {/* Track */}
      <div
        className="h-4 rounded-full bg-slate-800 overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Daily water intake progress"
      >
        <div
          className={[
            'h-full rounded-full transition-all duration-500 ease-out',
            barColor(pct),
          ].join(' ')}
          style={{ width: `${pct}%` }}
        />
      </div>

      {reached && (
        <p className="text-xs text-sky-400 font-medium flex items-center gap-1">
          <span aria-hidden="true">🎉</span> Goal reached — nice hydration!
        </p>
      )}
    </div>
  )
}
