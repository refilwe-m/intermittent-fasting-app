import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Wraps authenticated routes.
 * - While loading: render nothing (avoids flash of redirect).
 * - Unauthenticated: redirect to /signin.
 * - Authenticated: render the nested route via <Outlet />.
 */
export function PrivateRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <span className="text-slate-400 text-sm animate-pulse">Loading…</span>
      </div>
    )
  }

  return user ? <Outlet /> : <Navigate to="/signin" replace />
}
