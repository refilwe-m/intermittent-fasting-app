/**
 * aiPromptBuilder
 *
 * Builds a plain-text, PII-free summary prompt for the AI coach.
 *
 * IMPORTANT (REQ-AI-5): no names, emails, user ids, or exact timestamps are
 * ever included — only aggregate counts and deltas. The output is safe to send
 * to a third-party inference API.
 */

const SYSTEM_INSTRUCTION =
  'You are a supportive weight-loss and fasting coach. Based on the anonymous ' +
  'weekly summary below, give ONE short, specific, encouraging suggestion ' +
  '(max 120 words). Be practical and kind. Do not invent data not present. ' +
  'Do not ask for personal information.'

/**
 * @param {{
 *   lastWeekActivities?: Record<string, number>, // e.g. { gym: 3, ran: 2 }
 *   fastingAdherenceDays?: number,                // days fasted in last 7
 *   avgWaterMl?: number,                          // average daily water (ml)
 *   weightDeltaKg?: number | null,                // change over the period (- = loss)
 * }} summary
 * @returns {string} prompt text
 */
export function buildAiPrompt({
  lastWeekActivities = {},
  fastingAdherenceDays = 0,
  avgWaterMl = 0,
  weightDeltaKg = null,
} = {}) {
  const lines = ['Weekly summary (anonymous):']

  // Activities
  const activityEntries = Object.entries(lastWeekActivities).filter(([, n]) => n > 0)
  if (activityEntries.length > 0) {
    const parts = activityEntries.map(([name, n]) => `${name} ${n}x`)
    lines.push(`- Activities: ${parts.join(', ')}`)
  } else {
    lines.push('- Activities: none logged')
  }

  // Fasting adherence
  lines.push(`- Fasted ${fastingAdherenceDays} of the last 7 days`)

  // Water
  if (avgWaterMl > 0) {
    lines.push(`- Average water: ${Math.round(avgWaterMl)} ml/day`)
  } else {
    lines.push('- Average water: not tracked')
  }

  // Weight delta
  if (weightDeltaKg != null) {
    const abs = Math.abs(weightDeltaKg).toFixed(1)
    if (weightDeltaKg < 0) lines.push(`- Weight change: down ${abs} kg`)
    else if (weightDeltaKg > 0) lines.push(`- Weight change: up ${abs} kg`)
    else lines.push('- Weight change: no change')
  } else {
    lines.push('- Weight change: not enough data')
  }

  return `${SYSTEM_INSTRUCTION}\n\n${lines.join('\n')}`
}

export { SYSTEM_INSTRUCTION }
