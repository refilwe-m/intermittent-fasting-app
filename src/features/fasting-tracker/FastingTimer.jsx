import { formatElapsed } from '../../common/utils/fastingState'

/**
 * FastingTimer
 *
 * SVG circular progress ring that represents elapsed time vs total fast duration.
 * - Ring fills clockwise from 12 o'clock as time passes.
 * - Inner text shows elapsed HH:MM:SS and phase label.
 * - For OMAD there's no defined end, so the ring fills over 23 hours.
 *
 * @param {{
 *   elapsedSeconds: number,
 *   totalSeconds: number,       // full fasting window in seconds
 *   fastingState: object,
 *   protocol: string,
 *   isActive: boolean,
 * }} props
 */

const RING_COLORS = {
  fed:     { track: '#1e293b', fill: '#f59e0b' }, // amber
  early:   { track: '#1e293b', fill: '#38bdf8' }, // sky
  ketosis: { track: '#1e293b', fill: '#8b5cf6' }, // violet
  deep:    { track: '#1e293b', fill: '#a855f7' }, // purple
}

export function FastingTimer({ elapsedSeconds, totalSeconds, fastingState, protocol, isActive }) {
  const SIZE = 240
  const STROKE = 14
  const RADIUS = (SIZE - STROKE) / 2
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS

  // Clamp progress between 0 and 1
  const progress = totalSeconds > 0 ? Math.min(elapsedSeconds / totalSeconds, 1) : 0
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  const colors = RING_COLORS[fastingState?.key] ?? RING_COLORS.fed
  const center = SIZE / 2

  const elapsedHours = Math.floor(elapsedSeconds / 3600)
  const elapsedMins  = Math.floor((elapsedSeconds % 3600) / 60)
  const elapsedSecs  = elapsedSeconds % 60

  const pad = (n) => String(n).padStart(2, '0')
  const timeString = `${pad(elapsedHours)}:${pad(elapsedMins)}:${pad(elapsedSecs)}`

  // Remaining time for non-OMAD protocols
  const remainingSeconds = Math.max(totalSeconds - elapsedSeconds, 0)
  const remH = Math.floor(remainingSeconds / 3600)
  const remM = Math.floor((remainingSeconds % 3600) / 60)
  const remainingString = `${remH}h ${String(remM).padStart(2, '0')}m left`

  const isOmad = protocol === 'omad'

  return (
    <div className="flex flex-col items-center gap-2" aria-label="Fasting timer">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="rotate-[-90deg]"  // start from 12 o'clock
          aria-hidden="true"
        >
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={RADIUS}
            fill="none"
            stroke={colors.track}
            strokeWidth={STROKE}
          />

          {/* Progress arc */}
          <circle
            cx={center}
            cy={center}
            r={RADIUS}
            fill="none"
            stroke={colors.fill}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.6s ease' }}
          />
        </svg>

        {/* Centre text — rotated back to normal */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
          {isActive ? (
            <>
              <span className="text-3xl font-bold tabular-nums text-white tracking-tight">
                {timeString}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {isOmad ? 'elapsed' : remainingString}
              </span>
              {fastingState && (
                <span className="text-xs font-semibold mt-1" style={{ color: colors.fill }}>
                  {fastingState.icon} {fastingState.label}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="text-4xl">⏱️</span>
              <span className="text-sm text-slate-400 mt-1">Not fasting</span>
            </>
          )}
        </div>
      </div>

      {/* Elapsed label below ring */}
      {isActive && !isOmad && (
        <p className="text-xs text-slate-500">
          {formatElapsed(elapsedSeconds)} elapsed
        </p>
      )}
    </div>
  )
}
