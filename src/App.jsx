import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './common/context/AuthContext'
import { PrivateRoute } from './common/components/PrivateRoute'
import { Nav } from './nav/Nav'

// Auth
import { SignIn } from './features/auth/SignIn'
import { AuthCallback } from './features/auth/AuthCallback'
import { ProfileSetup } from './features/profile/ProfileSetup'

// Feature pages
import { FastingTracker } from './features/fasting-tracker/FastingTracker'

// Stub pages — filled out in later phases
const Stub = ({ label }) => (
  <div className="flex items-center justify-center h-full text-slate-400 text-sm">{label}</div>
)
const Dashboard = () => <Stub label="Dashboard — coming soon" />
const Activity  = () => <Stub label="Activity Check-in — coming soon" />
const Streaks   = () => <Stub label="Streak Board — coming soon" />
const Water     = () => <Stub label="Water Tracker — coming soon" />
const Weight    = () => <Stub label="Weight Log — coming soon" />
const Profile   = () => <Stub label="Profile — coming soon" />

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col h-screen">
          <main className="flex-1 overflow-y-auto pb-16">
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
                <Route path="/activity"  element={<Activity />} />
                <Route path="/streaks"   element={<Streaks />} />
                <Route path="/water"     element={<Water />} />
                <Route path="/weight"    element={<Weight />} />
                <Route path="/profile"   element={<Profile />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>

          {/* Bottom nav only on authenticated app routes */}
          <Nav />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
