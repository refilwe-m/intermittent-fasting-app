import { useDashboardData } from './hooks/useDashboardData'
import { FastingWidget } from './widgets/FastingWidget'
import { StreakWidget } from './widgets/StreakWidget'
import { WaterWidget } from './widgets/WaterWidget'
import { WeightWidget } from './widgets/WeightWidget'
import { AiSuggestionWidget } from './widgets/AiSuggestionWidget'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Dashboard (/dashboard) — the default authenticated view.
 *
 * A 2-column grid of widget cards, each linking to its full feature page.
 * All data comes from a single parallel-fetch hook (useDashboardData).
 */
export function Dashboard() {
  const {
    fasting,
    streak,
    water,
    weight,
    profile,
    loading,
    error,
  } = useDashboardData()

  const unitSystem = profile?.unit_system ?? 'metric'
  const name = profile?.display_name?.split(' ')[0]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        Loading your dashboard…
      </div>
    )
  }

  return (
    <div className="min-h-full bg-slate-950 px-4 py-6 space-y-5 max-w-sm mx-auto">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-white">
          {greeting()}{name ? `, ${name}` : ''}
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Here's your day at a glance</p>
      </div>

      {/* Widget grid */}
      <div className="grid grid-cols-2 gap-3 auto-rows-fr">
        <FastingWidget fasting={fasting} />
        <StreakWidget streak={streak} />
        <WaterWidget water={water} unitSystem={unitSystem} />
        <WeightWidget weight={weight} unitSystem={unitSystem} />
        <AiSuggestionWidget />
      </div>

      {error && (
        <p role="alert" className="text-red-400 text-xs text-center">
          {error}
        </p>
      )}
    </div>
  )
}
