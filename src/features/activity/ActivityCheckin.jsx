/**
 * ActivityCheckin
 *
 * Checkbox list for the 5 default activities. Each item is a large
 * thumb-friendly tap target (min 56px height).
 *
 * @param {{
 *   activities: string[],
 *   onToggle: (id: string) => void,
 * }} props
 */

const DEFAULT_ACTIVITIES = [
  { id: 'gym',    label: 'Gym',           icon: '🏋️', description: 'Weight training or gym session' },
  { id: 'fasted', label: 'Fasted',        icon: '⏱️', description: 'Completed a fasting window' },
  { id: 'ran',    label: 'Ran',           icon: '🏃', description: 'Running or jogging' },
  { id: 'walked', label: 'Steps goal',    icon: '🚶', description: 'Reached daily step count' },
  { id: 'hiked',  label: 'Hiked',         icon: '🥾', description: 'Hiking or trail walk' },
]

export { DEFAULT_ACTIVITIES }

export function ActivityCheckin({ activities, onToggle }) {
  return (
    <div className="space-y-2" role="group" aria-label="Today's activities">
      {DEFAULT_ACTIVITIES.map((activity) => {
        const checked = activities.includes(activity.id)

        return (
          <button
            key={activity.id}
            type="button"
            role="checkbox"
            aria-checked={checked}
            aria-label={activity.label}
            onClick={() => onToggle(activity.id)}
            className={[
              'w-full flex items-center gap-4 px-4 rounded-2xl border transition-all',
              'min-h-[56px] text-left focus:outline-none focus:ring-2 focus:ring-blue-500',
              'active:scale-[0.98]',
              checked
                ? 'bg-green-600/15 border-green-500/40 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500',
            ].join(' ')}
          >
            {/* Custom checkbox indicator */}
            <span
              className={[
                'flex items-center justify-center w-6 h-6 rounded-full border-2 shrink-0 transition-colors',
                checked
                  ? 'bg-green-500 border-green-500'
                  : 'border-slate-600',
              ].join(' ')}
              aria-hidden="true"
            >
              {checked && (
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>

            {/* Icon */}
            <span className="text-2xl" aria-hidden="true">{activity.icon}</span>

            {/* Label + description */}
            <div className="flex-1 min-w-0">
              <p className={['font-semibold text-sm', checked ? 'text-white' : 'text-slate-200'].join(' ')}>
                {activity.label}
              </p>
              <p className="text-xs text-slate-500 truncate">{activity.description}</p>
            </div>

            {/* Checked streak pulse */}
            {checked && (
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
