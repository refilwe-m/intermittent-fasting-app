/**
 * aiClient
 *
 * generateSuggestion(prompt) → Promise<string>
 *
 * Provider resolution:
 *   1. If VITE_OLLAMA_URL is set → use local Ollama (/api/generate). Great for
 *      offline/dev and avoids any third-party call.
 *   2. Otherwise → HuggingFace router (OpenAI-compatible chat completions).
 *      Uses VITE_HUGGINGFACE_TOKEN if present (higher free-tier limits).
 *
 * Throws on error so the caller can show a friendly fallback.
 */

const HF_MODEL =
  import.meta.env.VITE_HF_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2'
const HF_URL = 'https://router.huggingface.co/v1/chat/completions'
const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'mistral'
const HF_TOKEN = import.meta.env.VITE_HUGGINGFACE_TOKEN

const MAX_TOKENS = 220

/**
 * @param {string} prompt
 * @returns {Promise<string>} the suggestion text
 */
export async function generateSuggestion(prompt) {
  if (!prompt || !prompt.trim()) {
    throw new Error('Empty prompt')
  }

  if (OLLAMA_URL) {
    return generateViaOllama(prompt)
  }
  return generateViaHuggingFace(prompt)
}

// ── HuggingFace (OpenAI-compatible chat completions) ──────────────────────────
async function generateViaHuggingFace(prompt) {
  const headers = { 'Content-Type': 'application/json' }
  if (HF_TOKEN) headers.Authorization = `Bearer ${HF_TOKEN}`

  const res = await fetch(HF_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: HF_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: MAX_TOKENS,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    if (res.status === 401 || res.status === 403) {
      throw new Error('AI service needs a HuggingFace token. Add VITE_HUGGINGFACE_TOKEN.')
    }
    if (res.status === 503) {
      throw new Error('AI model is warming up — try again in a moment.')
    }
    throw new Error(`AI request failed (${res.status}). ${body.slice(0, 120)}`)
  }

  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error('AI returned an empty response.')
  return text.trim()
}

// ── Ollama (local) ────────────────────────────────────────────────────────────
async function generateViaOllama(prompt) {
  const res = await fetch(`${OLLAMA_URL.replace(/\/$/, '')}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: { num_predict: MAX_TOKENS, temperature: 0.7 },
    }),
  })

  if (!res.ok) {
    throw new Error(`Local AI request failed (${res.status}).`)
  }

  const data = await res.json()
  const text = data?.response
  if (!text) throw new Error('Local AI returned an empty response.')
  return text.trim()
}
