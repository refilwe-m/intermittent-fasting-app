import { WidgetCard } from './WidgetCard'
import { formatElapsed } from '../../../common/utils/fastingState'

/**
 * FastingWidget — shows the active fast's state + elapsed time, or a prompt
 * to start one. Links to /fast.
 *
 * @param {{ fasting: { active: boolean, elapsedSeconds: number, stateLabel: string, stateIcon: string } | null }} props
 */
export function FastingWidget({ fasting }) {
  return (
    <WidgetCard title="Fasting" icon="⏱️" to="/fast" accent="bg-blue-600/20">
      {fasting?.active ? (
        <>
          <p className="text-2xl font-bold text-white tabular-nums">
            {formatElapsed(fasting.elapsedSeconds)}
          </p>
          <p className="text-xs text-blue-300 mt-0.5">
            {fasting.stateIcon} {fasting.stateLabel}
          </p>
        </>
      ) : (
        <>
          <p className="text-lg font-semibold text-slate-300">Not fasting</p>
          <p className="text-xs text-slate-500 mt-0.5">Tap to start a fast</p>
        </>
      )}
    </WidgetCard>
  )
}
