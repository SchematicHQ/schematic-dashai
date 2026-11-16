// Models the prompt builder offers. Safe to import from client components.
//
// Anthropic models only, since Schematic has list prices for them, so every
// inference event gets a cost without adding a rate sheet.
export const MODELS = [
  { id: "claude-opus-5-5", label: "Claude Opus 5.5" },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5" },
  { id: "claude-haiku-5-5", label: "Claude Haiku 5.5" },
] as const

export type ModelId = (typeof MODELS)[number]["id"]

export const DEFAULT_MODEL: ModelId = "claude-sonnet-5-5"

export function isModelId(value: unknown): value is ModelId {
  return MODELS.some((model) => model.id === value)
}

// Event names on the inference events. Each matches an inference feature in
// Schematic, which burns credits for the events that carry it.
export const INFERENCE_EVENTS = {
  dashboardPrompt: "dashboard-prompt",
  validateDataSource: "validate-data-source",
} as const

// Flag keys of those features, for credit checks in the browser. Dashboard
// Prompt (AI) gets its own key because the older track-based Dashboard Prompt
// feature, still used by the Vue and Angular apps, already has
// "dashboard-prompt".
export const FLAG_KEYS = {
  dashboardPrompt: "dashboard-prompt-ai",
  validateDataSource: "validate-data-source",
} as const
