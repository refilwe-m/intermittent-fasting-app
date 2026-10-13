/**
 * BMI + weight-unit helpers.
 *
 * Weight is always stored in kilograms in the database. Display converts to
 * pounds when the user's profile uses the imperial system.
 */

const LBS_PER_KG = 2.2046226218

/** kg → pounds */
export function kgToLbs(kg) {
  return kg * LBS_PER_KG
}

/** pounds → kg */
export function lbsToKg(lbs) {
  return lbs / LBS_PER_KG
}

/**
 * Body Mass Index = weight(kg) / height(m)^2.
 * @param {number} weightKg
 * @param {number} heightCm
 * @returns {number|null} BMI rounded to 1 dp, or null if inputs invalid
 */
export function calculateBmi(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm <= 0) return null
  const heightM = heightCm / 100
  const bmi = weightKg / (heightM * heightM)
  return Math.round(bmi * 10) / 10
}

/**
 * Standard WHO BMI category for an adult.
 * @param {number} bmi
 * @returns {{ label: string, color: string }}
 */
export function bmiCategory(bmi) {
  if (bmi == null) return { label: '—', color: 'text-slate-400' }
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-sky-400' }
  if (bmi < 25) return { label: 'Healthy', color: 'text-green-400' }
  if (bmi < 30) return { label: 'Overweight', color: 'text-amber-400' }
  return { label: 'Obese', color: 'text-red-400' }
}

/**
 * Format a kg value in the user's preferred unit.
 * @param {number} kg
 * @param {'metric'|'imperial'} unitSystem
 * @param {boolean} withUnit include the unit label
 * @returns {string}
 */
export function formatWeight(kg, unitSystem = 'metric', withUnit = true) {
  if (kg == null) return '—'
  if (unitSystem === 'imperial') {
    const lbs = Math.round(kgToLbs(kg) * 10) / 10
    return withUnit ? `${lbs} lbs` : `${lbs}`
  }
  const rounded = Math.round(kg * 10) / 10
  return withUnit ? `${rounded} kg` : `${rounded}`
}
