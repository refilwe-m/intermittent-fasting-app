/**
 * FastingStateBadge
 *
 * Displays a colour-coded pill for the current fasting phase.
 *
 * Colors (per design.md):
 *   fed      → amber
 *   early    → sky
 *   ketosis  → violet
 *   deep     → purple
 */

const STATE_STYLES = {
  fed: {
    pill: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  early: {
    pill: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    dot: 'bg-sky-400',
  },
  ketosis: {
    pill: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    dot: 'bg-violet-400',
  },
  deep: {
    pill: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    dot: 'bg-purple-400',
  },
}

/**
 * @param {{
 *   fastingState: { key: string, label: string, icon: string, description: string },
 *   showDescription?: boolean,
 *   size?: 'sm' | 'md'
 * }} props
 */
export function FastingStateBadge({ fastingState, showDescription = false, size = 'md' }) {
  if (!fastingState) return null

  const styles = STATE_STYLES[fastingState.key] ?? STATE_STYLES.fed
  const isSmall = size === 'sm'

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={[
          'inline-flex items-center gap-1.5 rounded-full border font-medium',
          isSmall ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
          styles.pill,
        ].join(' ')}
        aria-label={`Fasting phase: ${fastingState.label}`}
      >
        {/* Animated pulse dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          <span
            className={[
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              styles.dot,
            ].join(' ')}
          />
          <span className={['relative inline-flex rounded-full h-2 w-2', styles.dot].join(' ')} />
        </span>

        <span>{fastingState.icon}</span>
        <span>{fastingState.label}</span>
      </span>

      {showDescription && (
        <p className="text-xs text-slate-400 text-center">{fastingState.description}</p>
      )}
    </div>
  )
}
