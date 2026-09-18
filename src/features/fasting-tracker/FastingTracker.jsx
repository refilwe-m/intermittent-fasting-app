import { useState, useEffect } from 'react'
import { useFastingSession } from './hooks/useFastingSession'
import { usePushNotifications } from './hooks/usePushNotifications'
import { ProtocolSelector } from './ProtocolSelector'
import { FastingTimer } from './FastingTimer'
import { FastingStateBadge } from './FastingStateBadge'
import { OmadCheckIn } from './OmadCheckIn'
import { getNextPhaseTransition, formatDuration } from '../../common/utils/fastingState'

// Default protocol shown before user picks one
const DEFAULT_PROTOCOL = { id: '16:8', label: '16:8', fastHours: 16, eatHours: 8 }

/**
 * FastingTracker page
 *
 * Composes:
 *  - ProtocolSelector (top)
 *  - FastingTimer (center — hero element)
 *  - FastingStateBadge
 *  - Start / Stop fast button (or OmadCheckIn for OMAD)
 *  - Next phase info card
 */
export function FastingTracker() {
  const {
    activeSession,
    elapsedSeconds,
    elapsedHours,
    fastingState,
    loading,
    error,
    startFast,
    endFast,
  } = useFastingSession()

  const { requestPermission } = usePushNotifications({ activeSession, elapsedSeconds })

  // If a session is already running, derive protocol from it; otherwise use default
  const [selectedProtocol, setSelectedProtocol] = useState(DEFAULT_PROTOCOL)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmStop, setConfirmStop] = useState(false)

  // Sync selectedProtocol when we load an active session
  useEffect(() => {
    if (activeSession) {
      const id = activeSession.protocol
      setSelectedProtocol((prev) => (prev.id === id ? prev : { id, label: id, fastHours: id === 'omad' ? 23 : parseInt(id), eatHours: id === 'omad' ? 1 : 24 - parseInt(id) }))
    }
  }, [activeSession?.id])

  const isOmad    = selectedProtocol?.id === 'omad'
  const totalSecs = (selectedProtocol?.fastHours ?? 16) * 3600

  const nextPhase = activeSession ? getNextPhaseTransition(elapsedHours) : null

  // ── Actions ──────────────────────────────────────────────────────────────

  async function handleStartFast() {
    setActionLoading(true)
    await requestPermission()   // ask for notification permission on first fast
    await startFast(selectedProtocol.id)
    setActionLoading(false)
  }

  async function handleStopFast() {
    setActionLoading(true)
    await endFast()
    setActionLoading(false)
    setConfirmStop(false)
  }

  // OMAD check-in: end fast + immediately start a new one
  async function handleOmadCheckIn() {
    await endFast()
    await startFast('omad')
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        Loading session…
      </div>
    )
  }

  return (
    <div className="min-h-full bg-slate-950 px-4 py-6 space-y-6 max-w-sm mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Fasting Tracker</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {activeSession ? 'Fast in progress' : 'No active fast'}
        </p>
      </div>

      {/* Protocol selector — hidden while a fast is running */}
      {!activeSession && (
        <ProtocolSelector
          selected={selectedProtocol?.id}
          onSelect={setSelectedProtocol}
        />
      )}

      {/* Active protocol chip */}
      {activeSession && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Protocol</span>
          <span className="bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {selectedProtocol?.label ?? activeSession.protocol}
          </span>
        </div>
      )}

      {/* Timer */}
      <div className="flex justify-center">
        <FastingTimer
          elapsedSeconds={elapsedSeconds}
          totalSeconds={totalSecs}
          fastingState={fastingState}
          protocol={selectedProtocol?.id}
          isActive={!!activeSession}
        />
      </div>

      {/* State badge */}
      {activeSession && (
        <div className="flex justify-center">
          <FastingStateBadge fastingState={fastingState} showDescription />
        </div>
      )}

      {/* OMAD check-in OR Start / Stop */}
      {isOmad ? (
        <OmadCheckIn
          onCheckIn={handleOmadCheckIn}
          activeSession={activeSession}
          elapsedSeconds={elapsedSeconds}
        />
      ) : activeSession ? (
        // Stop fast section
        confirmStop ? (
          <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-4 space-y-3">
            <p className="text-sm text-white font-medium text-center">End your fast?</p>
            <p className="text-xs text-slate-400 text-center">
              You've fasted for {Math.floor(elapsedSeconds / 3600)}h{' '}
              {Math.floor((elapsedSeconds % 3600) / 60)}m. This can't be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmStop(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-xl py-3 text-sm transition-colors"
              >
                Keep going
              </button>
              <button
                type="button"
                onClick={handleStopFast}
                disabled={actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
              >
                {actionLoading ? 'Stopping…' : 'End fast'}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmStop(true)}
            className="w-full bg-slate-800 border border-slate-700 hover:border-red-500/50 hover:bg-red-900/10 text-slate-300 font-medium rounded-2xl py-4 text-sm transition-colors"
          >
            🛑 End fast
          </button>
        )
      ) : (
        // Start fast button
        <button
          type="button"
          onClick={handleStartFast}
          disabled={actionLoading || !selectedProtocol}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl py-5 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-[0.98]"
          aria-label={`Start ${selectedProtocol?.label ?? ''} fast`}
        >
          {actionLoading ? 'Starting…' : `▶ Start ${selectedProtocol?.label ?? ''} fast`}
        </button>
      )}

      {/* Next phase card */}
      {nextPhase && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
          <span className="text-lg">{nextPhase.state.icon}</span>
          <div>
            <p className="text-xs font-medium text-slate-300">
              Next: {nextPhase.state.label}
            </p>
            <p className="text-xs text-slate-500">
              in {formatDuration(Math.ceil(nextPhase.hoursFromNow * 3600))}
            </p>
          </div>
        </div>
      )}

      {/* Completed fast summary */}
      {!activeSession && elapsedSeconds === 0 && !loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <p className="text-slate-400 text-sm">
            Pick a protocol above and tap <strong className="text-white">Start fast</strong> when you finish your last meal.
          </p>
        </div>
      )}

      {/* Error display */}
      {error && (
        <p role="alert" className="text-red-400 text-xs text-center">
          {error}
        </p>
      )}
    </div>
  )
}
