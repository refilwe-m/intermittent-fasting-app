import { useState } from 'react'

/**
 * CustomActivityInput
 *
 * Allows adding one-off activity labels that aren't in the default list.
 * - Text field with submit button
 * - History chips from the last 30 days for quick re-selection
 * - Active custom activities shown as dismissible tags below
 *
 * @param {{
 *   activities: string[],          // full activities array (includes 'custom:...' entries)
 *   customHistory: string[],       // deduplicated labels from recent history
 *   onAdd: (label: string) => void,
 *   onRemove: (activityId: string) => void,
 * }} props
 */
export function CustomActivityInput({ activities, customHistory, onAdd, onRemove }) {
  const [input, setInput] = useState('')

  // Active custom activities from today
  const activeCustom = activities
    .filter((a) => a.startsWith('custom:'))
    .map((a) => ({ id: a, label: a.replace('custom:', '') }))

  // History chips that aren't already active today
  const suggestionChips = customHistory.filter(
    (label) => !activities.includes(`custom:${label}`)
  )

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setInput('')
  }

  function handleChipClick(label) {
    onAdd(label)
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
        Custom activity
      </p>

      {/* Text input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Yoga, Swimming, Cycling…"
          maxLength={50}
          className={[
            'flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3',
            'text-sm text-white placeholder-slate-500',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
          ].join(' ')}
          aria-label="Custom activity name"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className={[
            'px-4 rounded-xl font-semibold text-sm transition-colors',
            'min-h-[48px] focus:outline-none focus:ring-2 focus:ring-blue-500',
            input.trim()
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed',
          ].join(' ')}
          aria-label="Add custom activity"
        >
          Add
        </button>
      </form>

      {/* History chips */}
      {suggestionChips.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 mb-2">Recent</p>
          <div className="flex flex-wrap gap-2">
            {suggestionChips.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => handleChipClick(label)}
                className={[
                  'bg-slate-800 border border-slate-700 hover:border-blue-500/50',
                  'text-slate-300 text-xs font-medium rounded-full px-3 py-1.5',
                  'transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
                ].join(' ')}
                aria-label={`Add ${label}`}
              >
                + {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active custom activities for today */}
      {activeCustom.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 mb-2">Added today</p>
          <div className="flex flex-wrap gap-2">
            {activeCustom.map(({ id, label }) => (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 bg-green-600/15 border border-green-500/30 text-green-300 text-xs font-medium rounded-full pl-3 pr-1.5 py-1.5"
              >
                {label}
                <button
                  type="button"
                  onClick={() => onRemove(id)}
                  className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-green-500/30 transition-colors"
                  aria-label={`Remove ${label}`}
                >
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
