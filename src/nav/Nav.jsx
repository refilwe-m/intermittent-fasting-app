import { NavLink, useLocation } from 'react-router-dom'

const HIDDEN_ON = ['/signin', '/auth/callback', '/profile/setup']

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Home',     icon: HomeIcon },
  { to: '/fast',      label: 'Fast',     icon: FastIcon },
  { to: '/activity',  label: 'Activity', icon: ActivityIcon },
  { to: '/streaks',   label: 'Streaks',  icon: StreakIcon },
  { to: '/profile',   label: 'Profile',  icon: ProfileIcon },
]

function HomeIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12L12 3l9 9M4.5 10.5V20a.5.5 0 0 0 .5.5h4.5v-5h5v5H19a.5.5 0 0 0 .5-.5v-9.5" />
    </svg>
  )
}
function FastIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="9" strokeLinecap="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
    </svg>
  )
}
function ActivityIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}
function StreakIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="4" height="4" rx="1" />
      <rect x="10" y="3" width="4" height="4" rx="1" />
      <rect x="17" y="3" width="4" height="4" rx="1" />
      <rect x="3" y="10" width="4" height="4" rx="1" />
      <rect x="10" y="10" width="4" height="4" rx="1" />
      <rect x="17" y="10" width="4" height="4" rx="1" />
      <rect x="3" y="17" width="4" height="4" rx="1" />
      <rect x="10" y="17" width="4" height="4" rx="1" />
      <rect x="17" y="17" width="4" height="4" rx="1" />
    </svg>
  )
}
function ProfileIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="8" r="4" strokeLinecap="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

export function Nav() {
  const { pathname } = useLocation()

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 inset-x-0 z-50 bg-slate-900/90 backdrop-blur border-t border-slate-800"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex justify-around items-center h-16">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center justify-center gap-0.5 w-full h-16',
                  'text-xs transition-colors',
                  isActive ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon active={isActive} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
