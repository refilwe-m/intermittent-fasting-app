import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../common/hooks/useSupabase'

export function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    // Supabase JS v2 with PKCE flow handles the code exchange automatically
    // when it detects a `code` param in the URL. We just need to listen for
    // the resulting session via onAuthStateChange.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe()

          // Check if this user already has a profile row
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle()

          navigate(profile ? '/dashboard' : '/profile/setup', { replace: true })
        }

        if (event === 'INITIAL_SESSION' && !session) {
          // No session came through — something went wrong
          setError('Sign-in failed. Please try again.')
          subscription.unsubscribe()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [navigate])

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 gap-4">
        <p className="text-red-400 text-sm text-center">{error}</p>
        <button
          onClick={() => navigate('/signin', { replace: true })}
          className="text-blue-400 underline text-sm"
        >
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <span className="text-slate-400 text-sm animate-pulse">Signing you in…</span>
    </div>
  )
}
