import type { ModelId } from "@/lib/models"

// DashAI doesn't call a real model, so these functions invent the usage a
// model call would report. The numbers follow Anthropic's Messages API, where
// `input_tokens` EXCLUDES cache reads and cache writes. See toInferenceBody in
// lib/inference-events.ts for the conversion to Schematic's shape.

export type FakeUsage = {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens: number
  cache_creation_input_tokens: number
}

export type FakeModelCall = {
  step: string
  model: ModelId
  usage: FakeUsage
}

export type DashboardOptions = {
  predictiveAnalytics: boolean
  anomalyDetection: boolean
  autoInsights: boolean
}

// The builder's context (system prompt, data source schemas, chart library docs
// and examples) is long and the same on every call, so it's cached. Sized so a
// generation lands around 100k tokens, like a real agent run.
const SYSTEM_PROMPT_TOKENS = 18_000
// Chance the cache is cold (expired, or the first generation in a while), so
// the first call writes it instead of reading it.
const CACHE_MISS_RATE = 0.15

function between(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1))
}

// Rough English token count.
function countTokens(text: string) {
  return Math.ceil(text.length / 4)
}

/**
 * One dashboard generation is several model calls: plan the layout, build the
 * charts, then one pass per analysis toggle. Bigger prompts, more toggles and
 * bigger models all cost more.
 */
export function fakeDashboardPromptCalls(model: ModelId, prompt: string, options: DashboardOptions): FakeModelCall[] {
  const promptTokens = countTokens(prompt)
  let cacheWarm = Math.random() >= CACHE_MISS_RATE

  const call = (step: string, freshInput: number, output: number): FakeModelCall => {
    const usage: FakeUsage = {
      input_tokens: freshInput,
      output_tokens: output,
      cache_read_input_tokens: cacheWarm ? SYSTEM_PROMPT_TOKENS : 0,
      cache_creation_input_tokens: cacheWarm ? 0 : SYSTEM_PROMPT_TOKENS,
    }
    // Whoever wrote the cache, every later call in this generation reads it.
    cacheWarm = true
    return { step, model, usage }
  }

  const calls = [
    // Sample rows from each data source, then outline the dashboard.
    call("plan", promptTokens + between(1_500, 3_000), between(800, 1_500)),
    // The plan plus query results in, chart specs and SQL out.
    call("build", promptTokens + between(6_000, 10_000), between(4_000, 8_000)),
  ]
  // Each analysis reads the queried data again and writes its own section.
  if (options.predictiveAnalytics) calls.push(call("predictive", between(8_000, 14_000), between(1_500, 3_000)))
  if (options.anomalyDetection) calls.push(call("anomaly-detection", between(8_000, 14_000), between(1_000, 2_500)))
  if (options.autoInsights) calls.push(call("auto-insights", between(6_000, 10_000), between(1_500, 2_500)))
  return calls
}

/**
 * Validating a data source is one uncached Sonnet call over its schema and a
 * sample of rows. At list price that's roughly 1 cent of model cost.
 */
export function fakeValidateDataSourceCall(): FakeModelCall {
  return {
    step: "validate",
    model: "claude-sonnet-5-5",
    usage: {
      input_tokens: between(3_500, 5_500),
      output_tokens: between(200, 400),
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
    },
  }
}
