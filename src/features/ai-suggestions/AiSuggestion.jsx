import { useAiSuggestion } from './useAiSuggestion'

function Skeleton() {
  return (
    <div className="space-y-2 animate-pulse" aria-hidden="true">
      <div className="h-3 bg-slate-800 rounded w-full" />
      <div className="h-3 bg-slate-800 rounded w-11/12" />
      <div className="h-3 bg-slate-800 rounded w-4/5" />
    </div>
  )
}

/**
 * AiSuggestion — standalone AI coach card.
 *
 * - On mount shows the latest cached suggestion.
 * - "Refresh" (or "Get suggestion" when empty) generates a new one.
 * - Shows a skeleton while generating.
 *
 * @param {{ compact?: boolean }} props
 */
export function AiSuggestion({ compact = false }) {
  const { suggestion, loading, generating, error, refresh, isToday } =
    useAiSuggestion()

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-500/20 text-sm" aria-hidden="true">
            ✨
          </span>
          <span className="text-xs font-medium text-slate-400">AI Coach</span>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={generating || loading}
          className="text-xs font-medium text-violet-300 hover:text-violet-200 disabled:opacity-50 transition-colors flex items-center gap-1"
          aria-label={suggestion ? 'Refresh suggestion' : 'Get a suggestion'}
        >
          <svg
            className={['w-3.5 h-3.5', generating ? 'animate-spin' : ''].join(' ')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {generating ? 'Thinking…' : suggestion ? 'Refresh' : 'Get suggestion'}
        </button>
      </div>

      {loading || generating ? (
        <Skeleton />
      ) : suggestion ? (
        <>
          <p className={['text-slate-200 leading-relaxed', compact ? 'text-xs line-clamp-4' : 'text-sm'].join(' ')}>
            {suggestion}
          </p>
          {isToday && (
            <p className="text-[10px] text-slate-600 mt-2">Generated today</p>
          )}
        </>
      ) : (
        <p className="text-sm text-slate-500 leading-relaxed">
          Tap “Get suggestion” for a personalised tip based on your last week of
          activity, fasting, water and weight.
        </p>
      )}

      {error && (
        <p role="alert" className="text-red-400 text-xs mt-2">
          {error}
        </p>
      )}
    </div>
  )
}
