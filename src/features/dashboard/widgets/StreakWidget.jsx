import { WidgetCard } from './WidgetCard'

/**
 * StreakWidget — current streak + today's activity count. Links to /streaks.
 *
 * @param {{ streak: { current: number, todayCount: number } }} props
 */
export function StreakWidget({ streak }) {
  return (
    <WidgetCard title="Streak" icon="🔥" to="/streaks" accent="bg-orange-500/20">
      <p className="text-2xl font-bold text-white">
        {streak.current}
        <span className="text-sm font-medium text-slate-400 ml-1">
          {streak.current === 1 ? 'day' : 'days'}
        </span>
      </p>
      <p className="text-xs text-slate-500 mt-0.5">
        {streak.todayCount > 0
          ? `${streak.todayCount} logged today`
          : 'Nothing logged today'}
      </p>
    </WidgetCard>
  )
}
