import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../common/hooks/useSupabase'
import { useAuth } from '../../../common/context/AuthContext'

// Every table that holds user-owned rows (for "delete all my data").
const USER_TABLES = [
  'ai_suggestions',
  'weight_logs',
  'daily_checkins',
  'fasting_sessions',
]

/**
 * useProfile
 *
 * Loads and updates the user's `profiles` row, and provides a
 * delete-all-data routine that wipes every user table then signs out.
 *
 * @returns {{
 *   profile: object | null,
 *   loading: boolean,
 *   saving: boolean,
 *   error: string | null,
 *   saveProfile: (fields: object) => Promise<boolean>,
 *   deleteAllData: () => Promise<void>,
 * }}
 */
export function useProfile() {
  const { user, signOut } = useAuth()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function load() {
      setLoading(true)
      const { data, error: loadError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (loadError) setError(loadError.message)
      else setProfile(data)
      setLoading(false)
    }

    load()
  }, [user])

  const saveProfile = useCallback(
    async (fields) => {
      if (!user) return false
      setSaving(true)
      setError(null)

      const { data, error: upsertError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...fields })
        .select('*')
        .single()

      setSaving(false)
      if (upsertError) {
        setError(upsertError.message)
        return false
      }
      setProfile(data)
      return true
    },
    [user]
  )

  const deleteAllData = useCallback(async () => {
    if (!user) return
    setError(null)

    // Delete child/data tables first, then the profile row.
    for (const table of USER_TABLES) {
      const { error: delError } = await supabase
        .from(table)
        .delete()
        .eq('user_id', user.id)
      if (delError) {
        setError(`Failed to delete ${table}: ${delError.message}`)
        return
      }
    }

    // profiles keys on `id`, not `user_id`
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id)
    if (profileError) {
      setError(`Failed to delete profile: ${profileError.message}`)
      return
    }

    await signOut()
  }, [user, signOut])

  return { profile, loading, saving, error, saveProfile, deleteAllData }
}
