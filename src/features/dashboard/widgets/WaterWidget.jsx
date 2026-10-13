import { WidgetCard } from './WidgetCard'
import { formatWater } from '../../../common/utils/units'

/**
 * WaterWidget — today's water intake. Links to /water.
 *
 * @param {{
 *   water: { ml: number },
 *   unitSystem: 'metric'|'imperial',
 * }} props
 */
export function WaterWidget({ water, unitSystem }) {
  return (
    <WidgetCard title="Water" icon="💧" to="/water" accent="bg-sky-500/20">
      <p className="text-2xl font-bold text-white">
        {formatWater(water.ml, unitSystem)}
      </p>
      <p className="text-xs text-slate-500 mt-0.5">
        {water.ml > 0 ? 'logged today' : 'None logged today'}
      </p>
    </WidgetCard>
  )
}
