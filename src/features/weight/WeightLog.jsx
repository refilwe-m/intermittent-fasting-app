import { useState } from 'react'
import { useWeightLog } from './hooks/useWeightLog'
import { WeightChart } from './WeightChart'
import { formatWeight, bmiCategory, lbsToKg } from '../../common/utils/bmi'

/**
 * WeightLog page (/weight)
 *
 * Composes:
 *  - summary stats (current weight, BMI, progress toward goal)
 *  - a weight entry form
 *  - WeightChart (trend line with goal reference)
 */
export function WeightLog() {
  const {
    logs,
    profile,
    latestWeight,
    bmi,
    progressPercent,
    unitSystem,
    loading,
    saving,
    error,
    logWeight,
  } = useWeightLog()

  const [input, setInput] = useState('')
  const [formError, setFormError] = useState(null)
  const isImperial = unitSystem === 'imperial'
  const cat = bmiCategory(bmi)

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)

    const val = parseFloat(input)
    if (!val || val <= 0) {
      setFormError('Enter a valid weight.')
      return
    }
    // Convert to kg for storage if the user is on imperial
    const kg = isImperial ? lbsToKg(val) : val
    if (kg < 20 || kg > 500) {
      setFormError('That weight looks out of range.')
      return
    }

    const ok = await logWeight(kg)
    if (ok) setInput('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        Loading weight history…
      </div>
    )
  }

  return (
    <div className="min-h-full bg-slate-950 px-4 py-6 space-y-6 max-w-sm mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Weight</h1>
        <p className="text-slate-400 text-sm mt-0.5">Track your progress over time</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2">
        <Stat
          label="Current"
          value={latestWeight != null ? formatWeight(latestWeight, unitSystem) : '—'}
          accent="text-white"
        />
        <Stat
          label="BMI"
          value={bmi != null ? bmi : '—'}
          sub={cat.label}
          accent={cat.color}
        />
        <Stat
          label="To goal"
          value={progressPercent != null ? `${progressPercent}%` : '—'}
          accent="text-blue-400"
        />
      </div>

      {/* Progress bar toward goal */}
      {progressPercent != null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>{formatWeight(profile?.starting_weight_kg, unitSystem)}</span>
            <span>Goal {formatWeight(profile?.goal_weight_kg, unitSystem)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Log form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="number"
          step="0.1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Today's weight (${isImperial ? 'lbs' : 'kg'})`}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={`Weight in ${isImperial ? 'pounds' : 'kilograms'}`}
        />
        <button
          type="submit"
          disabled={saving || !input.trim()}
          className="px-5 min-h-[48px] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors"
        >
          {saving ? '…' : 'Log'}
        </button>
      </form>

      {formError && <p role="alert" className="text-red-400 text-xs -mt-3">{formError}</p>}

      {/* Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
          Trend
        </p>
        <WeightChart
          logs={logs}
          goalKg={profile?.goal_weight_kg ?? null}
          unitSystem={unitSystem}
        />
      </div>

      {error && (
        <p role="alert" className="text-red-400 text-xs text-center">
          {error}
        </p>
      )}
    </div>
  )
}

function Stat({ label, value, sub, accent }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
      <div className={['text-lg font-bold', accent].join(' ')}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500">{sub}</div>}
      <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  )
}
