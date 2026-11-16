import type { FakeModelCall } from "@/lib/fake-inference"

// The identity the rest of the app uses: every user belongs to the "demo"
// company (see components/client-wrapper.tsx).
export const DEMO_COMPANY = { id: "demo" }

type InferenceEventBody = {
  company: Record<string, string>
  user?: Record<string, string>
  event: string
  provider: string
  request_model?: string
  response_model: string
  input_tokens: number
  output_tokens: number
  cached_input_tokens?: number
  cache_creation_input_tokens?: number
}

/**
 * Maps an Anthropic-style model call onto Schematic's inference event.
 *
 * Schematic's `input_tokens` is the WHOLE prompt, cache reads and writes
 * included, while Anthropic's leaves them out. Sending Anthropic's number as-is
 * would leave the cached part of every prompt unbilled.
 */
export function toInferenceBody(
  call: FakeModelCall,
  { event, user }: { event: string; user?: Record<string, string> },
): InferenceEventBody {
  const { usage } = call
  return {
    company: DEMO_COMPANY,
    user,
    event,
    provider: "anthropic",
    request_model: call.model,
    // A real app sends the model from the response (`message.model`), which
    // can differ from the request when an alias or fallback serves the call.
    response_model: call.model,
    input_tokens: usage.input_tokens + usage.cache_read_input_tokens + usage.cache_creation_input_tokens,
    cached_input_tokens: usage.cache_read_input_tokens,
    cache_creation_input_tokens: usage.cache_creation_input_tokens,
    output_tokens: usage.output_tokens,
  }
}

/**
 * Sends one inference event to Schematic. Needs the secret key: the events API
 * refuses inference events sent with a publishable key.
 *
 * This posts the JSON directly instead of calling the Node SDK's
 * `events.createEvent`, because the SDK serializes an inference body that has an
 * `event` name as a track event and drops the model and token fields.
 */
export async function sendInferenceEvent(body: InferenceEventBody) {
  const apiKey = process.env.SCHEMATIC_SECRET_KEY
  if (!apiKey) {
    console.warn("[schematic] SCHEMATIC_SECRET_KEY is not set; skipping inference event")
    return
  }

  const res = await fetch("https://api.schematichq.com/events", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Schematic-Api-Key": apiKey },
    body: JSON.stringify({ event_type: "inference", body }),
  })
  if (!res.ok) {
    throw new Error(`Schematic events API ${res.status}: ${await res.text()}`)
  }
}

/** Sends one event per model call. Logs failures rather than throwing, since billing shouldn't break the feature. */
export async function sendInferenceEvents(
  calls: FakeModelCall[],
  context: { event: string; user?: Record<string, string> },
) {
  const results = await Promise.allSettled(calls.map((call) => sendInferenceEvent(toInferenceBody(call, context))))
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[schematic] inference event failed", result.reason)
    }
  }
}
