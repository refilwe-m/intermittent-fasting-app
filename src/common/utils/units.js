/**
 * Unit conversion helpers.
 *
 * Water is always stored in millilitres (ml) in the database. Display can be
 * in ml/L (metric) or fluid ounces (imperial) based on the user's profile.
 */

const ML_PER_OZ = 29.5735

/** ml → US fluid ounces */
export function mlToOz(ml) {
  return ml / ML_PER_OZ
}

/** US fluid ounces → ml */
export function ozToMl(oz) {
  return oz * ML_PER_OZ
}

/**
 * Format a millilitre value for display in the user's preferred unit system.
 * @param {number} ml
 * @param {'metric'|'imperial'} unitSystem
 * @returns {string} e.g. "1.5 L" or "51 oz"
 */
export function formatWater(ml, unitSystem = 'metric') {
  if (unitSystem === 'imperial') {
    return `${Math.round(mlToOz(ml))} oz`
  }
  // Metric: show litres once we're at/over 1000 ml, otherwise ml
  if (ml >= 1000) return `${(ml / 1000).toFixed(1)} L`
  return `${Math.round(ml)} ml`
}

/**
 * The quick-add increments, expressed in ml, with a label per unit system.
 * Imperial labels approximate common cup/bottle sizes.
 * @param {'metric'|'imperial'} unitSystem
 * @returns {{ ml: number, label: string }[]}
 */
export function quickAddOptions(unitSystem = 'metric') {
  if (unitSystem === 'imperial') {
    return [
      { ml: 240, label: '8 oz' },
      { ml: 350, label: '12 oz' },
      { ml: 500, label: '16 oz' },
      { ml: 750, label: '24 oz' },
    ]
  }
  return [
    { ml: 250, label: '250 ml' },
    { ml: 500, label: '500 ml' },
    { ml: 750, label: '750 ml' },
    { ml: 1000, label: '1 L' },
  ]
}
