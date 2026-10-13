import { quickAddOptions } from '../../common/utils/units'

/**
 * QuickAddButtons — grid of preset water amounts to add in one tap.
 *
 * @param {{
 *   unitSystem: 'metric'|'imperial',
 *   onAdd: (ml: number) => void,
 * }} props
 */
export function QuickAddButtons({ unitSystem, onAdd }) {
  const options = quickAddOptions(unitSystem)

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
        Quick add
      </p>
      <div className="grid grid-cols-2 gap-3">
        {options.map(({ ml, label }) => (
          <button
            key={ml}
            type="button"
            onClick={() => onAdd(ml)}
            className={[
              'min-h-[56px] flex items-center justify-center gap-2 rounded-2xl',
              'bg-sky-600/15 border border-sky-500/30 text-sky-200 font-semibold',
              'hover:bg-sky-600/25 active:scale-[0.98] transition-all',
              'focus:outline-none focus:ring-2 focus:ring-sky-500',
            ].join(' ')}
            aria-label={`Add ${label} of water`}
          >
            <span className="text-lg" aria-hidden="true">💧</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
