/**
 * Fasting phase logic.
 *
 * Phases are based on hours elapsed since the fast started:
 *   < 4 h   → 'fed'       Fed / digesting
 *   4–12 h  → 'early'     Early fast / glycogen depletion
 *   12–18 h → 'ketosis'   Entering ketosis
 *   ≥ 18 h  → 'deep'      Deep fast / autophagy
 */

export const FASTING_STATES = {
  fed: {
    key: 'fed',
    label: 'Fed',
    description: 'Digesting your last meal.',
    icon: '🍽️',
    color: 'amber',
    minHours: 0,
  },
  early: {
    key: 'early',
    label: 'Early Fast',
    description: 'Glycogen stores depleting.',
    icon: '⚡',
    color: 'sky',
    minHours: 4,
  },
  ketosis: {
    key: 'ketosis',
    label: 'Ketosis',
    description: 'Fat burning has begun.',
    icon: '🔥',
    color: 'violet',
    minHours: 12,
  },
  deep: {
    key: 'deep',
    label: 'Deep Fast',
    description: 'Autophagy in progress.',
    icon: '💫',
    color: 'purple',
    minHours: 18,
  },
}

/**
 * Returns the fasting state object for the given number of elapsed hours.
 * @param {number} elapsedHours
 * @returns {typeof FASTING_STATES[keyof typeof FASTING_STATES]}
 */
export function getFastingState(elapsedHours) {
  if (elapsedHours >= 18) return FASTING_STATES.deep
  if (elapsedHours >= 12) return FASTING_STATES.ketosis
  if (elapsedHours >= 4) return FASTING_STATES.early
  return FASTING_STATES.fed
}

/**
 * Given elapsed hours and a total fast duration, returns the next phase
 * transition in hours (absolute, from fast start). Returns null if already
 * at the final phase.
 * @param {number} elapsedHours
 * @returns {{ state: object, hoursFromNow: number } | null}
 */
export function getNextPhaseTransition(elapsedHours) {
  const thresholds = [4, 12, 18]
  for (const h of thresholds) {
    if (elapsedHours < h) {
      return {
        state: getFastingState(h),
        hoursFromNow: h - elapsedHours,
      }
    }
  }
  return null
}

/**
 * Formats elapsed seconds into HH:MM:SS string.
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatElapsed(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = Math.floor(totalSeconds % 60)
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

/**
 * Formats a duration in seconds as "Xh Ym" for display.
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
