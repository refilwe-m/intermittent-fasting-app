import { useState, useEffect } from 'react'
import { useProfile } from './hooks/useProfile'
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
  'w-full min-h-[48px] bg-slate-800 border border-slate-700 rounded-xl px-4 text-white ' +
  'placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

/**
 * Profile page (/profile)
 *
 * - View/edit the profiles row (TASK-034)
 * - Sign out
 * - Delete all my data (confirmation → wipe every table → sign out)
 */
export function Profile() {
  const { user, signOut } = useAuth()
  const { profile, loading, saving, error, saveProfile, deleteAllData } = useProfile()

  const [form, setForm] = useState(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Seed the form once the profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name ?? '',
        height_cm: profile.height_cm ?? '',
        starting_weight_kg: profile.starting_weight_kg ?? '',
        goal_weight_kg: profile.goal_weight_kg ?? '',
        unit_system: profile.unit_system ?? 'metric',
      })
    }
  }, [profile])

  function set(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    const ok = await saveProfile({
      display_name: form.display_name.trim(),
      height_cm: parseFloat(form.height_cm) || null,
      starting_weight_kg: parseFloat(form.starting_weight_kg) || null,
      goal_weight_kg: parseFloat(form.goal_weight_kg) || null,
      unit_system: form.unit_system,
    })
    if (ok) {
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 2000)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteAllData()
    // deleteAllData signs the user out on success; if it errored, re-enable.
    setDeleting(false)
  }

  if (loading || !form) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        Loading profile…
      </div>
    )
  }

  const isMetric = form.unit_system === 'metric'

  return (
    <div className="min-h-full bg-slate-950 px-4 py-6 space-y-6 max-w-sm mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Profile</h1>
        <p className="text-slate-400 text-sm mt-0.5">{user?.email}</p>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <Field label="Name">
          <input type="text" value={form.display_name} onChange={set('display_name')} className={inputClass} autoComplete="name" />
        </Field>

        <Field label="Units">
          <div className="flex gap-2">
            {['metric', 'imperial'].map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setForm((p) => ({ ...p, unit_system: u }))}
                className={[
                  'flex-1 min-h-[48px] rounded-xl border text-sm font-medium transition-colors',
                  form.unit_system === u
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300',
                ].join(' ')}
              >
                {u === 'metric' ? 'Metric' : 'Imperial'}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Height" hint={isMetric ? 'cm' : 'inches'}>
          <input type="number" value={form.height_cm} onChange={set('height_cm')} className={inputClass} />
        </Field>

        <Field label="Starting weight" hint={isMetric ? 'kg' : 'lbs'}>
          <input type="number" value={form.starting_weight_kg} onChange={set('starting_weight_kg')} className={inputClass} />
        </Field>

        <Field label="Goal weight" hint={isMetric ? 'kg' : 'lbs'}>
          <input type="number" value={form.goal_weight_kg} onChange={set('goal_weight_kg')} className={inputClass} />
        </Field>

        {error && <p role="alert" className="text-red-400 text-xs">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full min-h-[48px] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
        >
          {saving ? 'Saving…' : savedFlash ? 'Saved ✓' : 'Save changes'}
        </button>
      </form>

      {/* Sign out */}
      <button
        type="button"
        onClick={signOut}
        className="w-full min-h-[48px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl transition-colors"
      >
        Sign out
      </button>

      {/* Danger zone */}
      <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-red-300">Delete all my data</h2>
          <p className="text-xs text-slate-400 mt-1">
            Permanently removes your profile, fasting sessions, check-ins, water,
            weight logs and AI suggestions. This cannot be undone.
          </p>
        </div>

        {!showDelete ? (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="w-full min-h-[48px] border border-red-500/40 text-red-300 hover:bg-red-900/20 font-medium rounded-xl transition-colors text-sm"
          >
            Delete everything
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Type <strong className="text-red-300">DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full min-h-[48px] bg-slate-800 border border-red-500/30 rounded-xl px-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Type DELETE to confirm"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowDelete(false); setConfirmText('') }}
                className="flex-1 min-h-[48px] bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={confirmText !== 'DELETE' || deleting}
                className="flex-1 min-h-[48px] bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors"
              >
                {deleting ? 'Deleting…' : 'Confirm delete'}
              </button>
            </div>
            {error && <p role="alert" className="text-red-400 text-xs">{error}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
