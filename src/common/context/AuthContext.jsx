import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../hooks/useSupabase'

const AuthContext = createContext(null)

/**
 * Provides { user, session, loading, signOut } to the whole app.
 * Wrap <App /> with this so every component can call useAuth().
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = not yet loaded
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Load existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    // Keep state in sync with Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    session,
    /** true while the initial session check hasn't resolved yet */
    loading: session === undefined,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * useAuth — consume auth state anywhere in the tree.
 * @returns {{ user: import('@supabase/supabase-js').User|null, session: object|null, loading: boolean, signOut: function }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
