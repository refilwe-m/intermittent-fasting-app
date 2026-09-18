import { useState } from 'react'

/**
 * Fasting protocols available in the selector.
 * `fastHours` is the fasting window length; `eatHours` is the eating window.
 * OMAD is special — check-in based, no countdown.
 */
const PROTOCOLS = [
  { id: 'omad',   label: 'OMAD',  subtitle: '23:1',      fastHours: 23, eatHours: 1 },
  { id: '20:4',   label: '20:4',  subtitle: '20h fast',  fastHours: 20, eatHours: 4 },
  { id: '18:6',   label: '18:6',  subtitle: '18h fast',  fastHours: 18, eatHours: 6 },
  { id: '16:8',   label: '16:8',  subtitle: '16h fast',  fastHours: 16, eatHours: 8 },
  { id: 'custom', label: 'Custom', subtitle: 'Set your own', fastHours: null, eatHours: null },
]

/**
 * ProtocolSelector
 *
 * Lets the user pick a fasting protocol. On selection of a non-custom protocol,
 * calls onSelect(protocol). For custom, shows a duration picker first.
 *
 * @param {{ selected: string|null, onSelect: (protocol: object) => void }} props
 */
export function ProtocolSelector({ selected, onSelect }) {
  const [showCustom, setShowCustom] = useState(false)
  const [customHours, setCustomHours] = useState(14)

  function handlePick(protocol) {
    if (protocol.id === 'custom') {
      setShowCustom(true)
      return
    }
    setShowCustom(false)
    onSelect(protocol)
  }

  function handleCustomConfirm() {
    const hours = Math.min(23, Math.max(1, Number(customHours)))
    onSelect({
      id: 'custom',
      label: `${hours}h`,
      subtitle: `${hours}h fast`,
      fastHours: hours,
      eatHours: 24 - hours,
    })
    setShowCustom(false)
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
        Choose a protocol
      </p>

      {/* Protocol buttons */}
      <div className="grid grid-cols-5 gap-2">
        {PROTOCOLS.map((p) => {
          const isActive = selected === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePick(p)}
              className={[
                'flex flex-col items-center justify-center rounded-xl py-3 px-1 border text-center',
                'transition-colors min-h-[72px] focus:outline-none focus:ring-2 focus:ring-blue-500',
                isActive
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500',
              ].join(' ')}
              aria-pressed={isActive}
              aria-label={`${p.label} — ${p.subtitle}`}
            >
              <span className="font-bold text-sm leading-tight">{p.label}</span>
              <span className={['text-xs mt-0.5', isActive ? 'text-blue-200' : 'text-slate-500'].join(' ')}>
                {p.subtitle}
              </span>
            </button>
          )
        })}
      </div>

      {/* Custom hours picker */}
      {showCustom && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
          <p className="text-sm text-slate-300 font-medium">Fasting window length</p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="23"
              value={customHours}
              onChange={(e) => setCustomHours(e.target.value)}
              className="flex-1 accent-blue-500"
              aria-label="Custom fasting hours"
            />
            <span className="text-white font-bold text-lg w-12 text-right">
              {customHours}h
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Eating window: {24 - customHours}h &nbsp;·&nbsp; {customHours}:{24 - customHours} protocol
          </p>
          <button
            type="button"
            onClick={handleCustomConfirm}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
          >
            Use {customHours}h fast
          </button>
        </div>
      )}
    </div>
  )
}
