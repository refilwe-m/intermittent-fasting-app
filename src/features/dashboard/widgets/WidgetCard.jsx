import { Link } from 'react-router-dom'

/**
 * WidgetCard — shared dashboard card shell.
 *
 * Renders a title row (with icon + optional "→" link to the feature page)
 * and a body for the key metric. The whole card is a link when `to` is set.
 *
 * @param {{
 *   title: string,
 *   icon: string,
 *   to?: string,
 *   accent?: string,       // tailwind text color for the icon chip
 *   className?: string,    // extra classes (e.g. col-span-2)
 *   children: React.ReactNode,
 * }} props
 */
export function WidgetCard({ title, icon, to, accent = 'bg-slate-800', className = '', children }) {
  const inner = (
    <div
      className={[
        'bg-slate-900 border border-slate-800 rounded-2xl p-4 h-full flex flex-col',
        to ? 'hover:border-slate-600 transition-colors' : '',
        className,
      ].join(' ')}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={['flex items-center justify-center w-7 h-7 rounded-lg text-sm', accent].join(' ')}
            aria-hidden="true"
          >
            {icon}
          </span>
          <span className="text-xs font-medium text-slate-400">{title}</span>
        </div>
        {to && <span className="text-slate-600 text-sm" aria-hidden="true">→</span>}
      </div>
      <div className="flex-1 flex flex-col justify-end">{children}</div>
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="block h-full focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-2xl" aria-label={`${title} — open`}>
        {inner}
      </Link>
    )
  }
  return inner
}
