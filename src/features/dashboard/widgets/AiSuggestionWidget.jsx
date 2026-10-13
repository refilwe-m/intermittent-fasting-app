import { AiSuggestion } from '../../ai-suggestions/AiSuggestion'

/**
 * AiSuggestionWidget — dashboard slot for the AI coach.
 *
 * Delegates to the self-contained AiSuggestion card, which loads the cached
 * suggestion and handles generation/refresh on its own. Spans both columns.
 */
export function AiSuggestionWidget() {
  return (
    <div className="col-span-2">
      <AiSuggestion compact />
    </div>
  )
}
