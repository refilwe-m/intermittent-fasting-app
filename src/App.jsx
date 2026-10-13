import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider } from './common/context/AuthContext'
import { PrivateRoute } from './common/components/PrivateRoute'
import { OfflineBanner } from './common/components/OfflineBanner'
import { Nav } from './nav/Nav'

// Auth
import { SignIn } from './features/auth/SignIn'
import { AuthCallback } from './features/auth/AuthCallback'
import { ProfileSetup } from './features/profile/ProfileSetup'

// Feature pages (eager: dashboard is the default landing route)
import { WeightPromptModal } from './features/weight/WeightPromptModal'
import { Dashboard } from './features/dashboard/Dashboard'

// Lazy-loaded feature routes — keep them out of the initial bundle.
// WeightLog in particular pulls in Recharts (~375 kB) (TASK-036).
const FastingTracker = lazy(() =>
  import('./features/fasting-tracker/FastingTracker').then((m) => ({ default: m.FastingTracker }))
)
const ActivityPage = lazy(() =>
  import('./features/activity/ActivityPage').then((m) => ({ default: m.ActivityPage }))
)
const StreakBoard = lazy(() =>
  import('./features/streak-board/StreakBoard').then((m) => ({ default: m.StreakBoard }))
)
const WaterTracker = lazy(() =>
  import('./features/water-tracker/WaterTracker').then((m) => ({ default: m.WaterTracker }))
)
const WeightLog = lazy(() =>
  import('./features/weight/WeightLog').then((m) => ({ default: m.WeightLog }))
)
const Profile = lazy(() =>
  import('./features/profile/Profile').then((m) => ({ default: m.Profile }))
)

function RouteFallback() {
  return (
    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
      Loading…
    </div>
  )
}

/**
 * Inner shell — lives inside the Router so it can use navigation hooks.
 */
function AppShell() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-screen">
      <OfflineBanner />
      <main className="flex-1 overflow-y-auto pb-16">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Public */}
            <Route path="/signin"         element={<SignIn />} />
            <Route path="/auth/callback"  element={<AuthCallback />} />

            {/* First-run profile setup (protected — user must be authed) */}
            <Route element={<PrivateRoute />}>
              <Route path="/profile/setup" element={<ProfileSetup />} />
            </Route>

            {/* Protected app routes — show bottom nav */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/fast"      element={<FastingTracker />} />
              <Route path="/activity"  element={<ActivityPage />} />
              <Route path="/streaks"   element={<StreakBoard />} />
              <Route path="/water"     element={<WaterTracker />} />
              <Route path="/weight"    element={<WeightLog />} />
              <Route path="/profile"   element={<Profile />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </main>

      {/* Every-3-weeks weigh-in nudge (self-hiding) */}
      <WeightPromptModal onLogNow={() => navigate('/weight')} />

      {/* Bottom nav only on authenticated app routes */}
      <Nav />
    </div>
  )
}

export default function App() {
  // import.meta.env.BASE_URL === the Vite `base` ('/intermittent-fasting-app/').
  // Strip the trailing slash for react-router's basename.
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '')
  return (
    <AuthProvider>
      <BrowserRouter basename={basename}>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  )
}
