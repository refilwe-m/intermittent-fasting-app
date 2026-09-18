import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../common/hooks/useSupabase'
import { useAuth } from '../../common/context/AuthContext'

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-300">
        {label}
        {hint && <span className="ml-1 text-slate-500 font-normal text-xs">({hint})</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  'tap-target w-full bg-slate-800 border border-slate-700 rounded-xl px-4 text-white ' +
  'placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

export function ProfileSetup() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    display_name: user?.user_metadata?.full_name ?? '',
    height_cm: '',
    starting_weight_kg: '',
    goal_weight_kg: '',
    unit_system: 'metric',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function set(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const height = parseFloat(form.height_cm)
    const start = parseFloat(form.starting_weight_kg)
    const goal = parseFloat(form.goal_weight_kg)

    if (!form.display_name.trim()) return setError('Please enter your name.')
    if (!height || height < 50 || height > 280) return setError('Enter a valid height (50–280 cm).')
    if (!start || start < 20 || start > 500) return setError('Enter a valid starting weight.')
    if (!goal || goal < 20 || goal > 500) return setError('Enter a valid goal weight.')

    setSaving(true)

    const { error: upsertError } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: form.display_name.trim(),
      height_cm: height,
      starting_weight_kg: start,
      goal_weight_kg: goal,
      unit_system: form.unit_system,
    })

    setSaving(false)

    if (upsertError) {
      setError(upsertError.message)
    } else {
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-2">🏁</div>
          <h1 className="text-2xl font-bold text-white">Let's set you up</h1>
          <p className="text-slate-400 text-sm mt-1">Just a few numbers to personalise your experience.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <Field label="Your name">
            <input
              type="text"
              value={form.display_name}
              onChange={set('display_name')}
              placeholder="e.g. Refilwe"
              className={inputClass}
              autoComplete="name"
            />
          </Field>

          <Field label="Units">
            <div className="flex gap-2">
              {['metric', 'imperial'].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, unit_system: u }))}
                  className={[
                    'flex-1 tap-target rounded-xl border text-sm font-medium transition-colors',
                    form.unit_system === u
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300',
                  ].join(' ')}
                >
                  {u === 'metric' ? 'Metric (kg / cm)' : 'Imperial (lbs / in)'}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Height" hint={form.unit_system === 'metric' ? 'cm' : 'inches'}>
            <input
              type="number"
              value={form.height_cm}
              onChange={set('height_cm')}
              placeholder={form.unit_system === 'metric' ? '170' : '67'}
              min="50"
              max="280"
              className={inputClass}
            />
          </Field>

          <Field label="Current weight" hint={form.unit_system === 'metric' ? 'kg' : 'lbs'}>
            <input
              type="number"
              value={form.starting_weight_kg}
              onChange={set('starting_weight_kg')}
              placeholder={form.unit_system === 'metric' ? '80' : '176'}
              min="20"
              max="500"
              className={inputClass}
            />
          </Field>

          <Field label="Goal weight" hint={form.unit_system === 'metric' ? 'kg' : 'lbs'}>
            <input
              type="number"
              value={form.goal_weight_kg}
              onChange={set('goal_weight_kg')}
              placeholder={form.unit_system === 'metric' ? '70' : '154'}
              min="20"
              max="500"
              className={inputClass}
            />
          </Field>

          {error && (
            <p role="alert" className="text-red-400 text-xs">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="tap-target w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
          >
            {saving ? 'Saving…' : "Let's go 🚀"}
          </button>
        </form>
      </div>
    </div>
  )
}
