import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { kgToLbs } from '../../common/utils/bmi'

/**
 * WeightChart — line chart of weight over time with a goal reference line.
 *
 * @param {{
 *   logs: { recorded_at: string, weight_kg: number }[],
 *   goalKg: number | null,
 *   unitSystem: 'metric'|'imperial',
 * }} props
 */
export function WeightChart({ logs, goalKg, unitSystem }) {
  const isImperial = unitSystem === 'imperial'
  const unitLabel = isImperial ? 'lbs' : 'kg'
  const toDisplay = (kg) => (isImperial ? Math.round(kgToLbs(kg) * 10) / 10 : Math.round(kg * 10) / 10)

  const data = logs.map((l) => ({
    date: format(parseISO(l.recorded_at), 'd MMM'),
    weight: toDisplay(l.weight_kg),
  }))

  const goalDisplay = goalKg != null ? toDisplay(goalKg) : null

  if (data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-slate-500 text-sm">
        Log your weight to see your trend here.
      </div>
    )
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#1e293b' }}
          />
          <YAxis
            domain={['dataMin - 2', 'dataMax + 2']}
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            contentStyle={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(value) => [`${value} ${unitLabel}`, 'Weight']}
          />
          {goalDisplay != null && (
            <ReferenceLine
              y={goalDisplay}
              stroke="#22c55e"
              strokeDasharray="4 4"
              label={{
                value: `Goal ${goalDisplay}`,
                fill: '#22c55e',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#2563eb"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#2563eb' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
