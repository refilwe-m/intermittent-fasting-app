import { WidgetCard } from './WidgetCard'
import { formatWeight, bmiCategory } from '../../../common/utils/bmi'

/**
 * WeightWidget — latest weight + BMI + progress toward goal. Links to /weight.
 *
 * @param {{
 *   weight: { latestKg: number|null, bmi: number|null, progressPercent: number|null },
 *   unitSystem: 'metric'|'imperial',
 * }} props
 */
export function WeightWidget({ weight, unitSystem }) {
  const cat = bmiCategory(weight.bmi)

  return (
    <WidgetCard title="Weight" icon="⚖️" to="/weight" accent="bg-green-500/20">
      {weight.latestKg != null ? (
        <>
          <p className="text-2xl font-bold text-white">
            {formatWeight(weight.latestKg, unitSystem)}
          </p>
          <p className="text-xs mt-0.5">
            {weight.bmi != null && (
              <span className={cat.color}>BMI {weight.bmi} · {cat.label}</span>
            )}
          </p>
          {weight.progressPercent != null && (
            <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${weight.progressPercent}%` }}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-lg font-semibold text-slate-300">No data</p>
          <p className="text-xs text-slate-500 mt-0.5">Log your first weight</p>
        </>
      )}
    </WidgetCard>
  )
}
