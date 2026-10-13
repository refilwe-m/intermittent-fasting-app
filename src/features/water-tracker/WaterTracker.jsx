import { useState } from 'react'
import { useWaterIntake } from './hooks/useWaterIntake'
import { WaterProgress } from './WaterProgress'
import { QuickAddButtons } from './QuickAddButtons'
import { mlToOz, ozToMl } from '../../common/utils/units'

/**
 * WaterTracker page (/water)
 *
 * Composes:
 *  - WaterProgress   — animated bar toward the daily goal
 *  - QuickAddButtons — preset add amounts
 *  - inline goal editor + reset
 */
export function WaterTracker() {
  const {
    waterMl,
    goalMl,
    unitSystem,
    loading,
    error,
    addWater,
    resetWater,
    setGoal,
  } = useWaterIntake()

  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('')

  const isImperial = unitSystem === 'imperial'

  function openGoalEditor() {
    const current = isImperial ? Math.round(mlToOz(goalMl)) : goalMl
    setGoalInput(String(current))
    setEditingGoal(true)
  }

  function saveGoal(e) {
    e.preventDefault()
    const val = parseFloat(goalInput)
    if (!val || val <= 0) {
      setEditingGoal(false)
      return
    }
    setGoal(isImperial ? ozToMl(val) : val)
    setEditingGoal(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        Loading water intake…
      </div>
    )
  }

  return (
    <div className="min-h-full bg-slate-950 px-4 py-6 space-y-6 max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Water</h1>
          <p className="text-slate-400 text-sm mt-0.5">Stay hydrated today</p>
        </div>
        <button
          type="button"
          onClick={openGoalEditor}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-400 transition-colors px-2 py-1 rounded-lg"
          aria-label="Edit daily water goal"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit goal
        </button>
      </div>

      {/* Goal editor */}
      {editingGoal && (
        <form
          onSubmit={saveGoal}
          className="bg-slate-900 border border-sky-500/30 rounded-2xl p-4 flex items-center gap-2"
        >
          <input
            type="number"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            min="1"
            autoFocus
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label={`Daily goal in ${isImperial ? 'ounces' : 'millilitres'}`}
          />
          <span className="text-sm text-slate-400">{isImperial ? 'oz' : 'ml'}</span>
          <button
            type="submit"
            className="bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm rounded-xl px-4 py-2.5 transition-colors"
          >
            Save
          </button>
        </form>
      )}

      {/* Progress */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <WaterProgress waterMl={waterMl} goalMl={goalMl} unitSystem={unitSystem} />
      </div>

      {/* Quick add */}
      <QuickAddButtons unitSystem={unitSystem} onAdd={addWater} />

      {/* Reset */}
      {waterMl > 0 && (
        <button
          type="button"
          onClick={resetWater}
          className="w-full text-slate-500 hover:text-red-400 text-xs font-medium py-2 transition-colors"
        >
          Reset today's water
        </button>
      )}

      {error && (
        <p role="alert" className="text-red-400 text-xs text-center">
          {error}
        </p>
      )}
    </div>
  )
}
