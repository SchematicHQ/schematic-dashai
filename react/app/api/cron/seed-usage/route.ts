import { NextRequest, NextResponse } from "next/server"
import { SchematicClient } from "@schematichq/schematic-typescript-node"
import { promises as fs } from "fs"
import path from "path"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const DAYS_IN_PERIOD = 30
const EXTREME_DAYS_TO_HIT_QUOTA = 5
const COMPANIES_PATH = "scripts/companies.json"
const DECIMALS = 4

function round4(n: number): number {
  return Math.round(n * 10 ** DECIMALS) / 10 ** DECIMALS
}

interface Company {
  id: string
  name: string
  tier: "free" | "paid" | "enterprise"
  usageLevel: "heavy" | "medium" | "light" | "extreme"
}

const FEATURES = { prompts: "dashboard-prompt" } as const

const PLAN_LIMITS = {
  free: { prompts: 500 },
  paid: { prompts: 1000 },
  enterprise: { prompts: 2500 },
} as const

/**
 * Target usage over 30 days (midpoint of the usage band). Fractional, rounded to 4 decimals.
 * "extreme" is not used here; extreme uses calendar-based logic in getDailyQuantity.
 */
function get30DayTarget(
  tier: "free" | "paid" | "enterprise",
  usageLevel: "heavy" | "medium" | "light" | "extreme"
): number {
  const limit = PLAN_LIMITS[tier].prompts
  let midPercent: number
  switch (usageLevel) {
    case "heavy":
      midPercent = 0.85 // midpoint of 70–100%
      break
    case "medium":
      midPercent = 0.5 // midpoint of 30–70%
      break
    case "light":
      midPercent = 0.175 // midpoint of 5–30%
      break
    case "extreme":
      return round4(limit) // 100% target; actual daily amount is calendar-based
  }
  return round4(Math.max(0.0001, limit * midPercent))
}

/**
 * Per-day quantity with jitter. Normal levels: base = target/30 × jitter.
 * Extreme: hit 100% of quota in first 5 days of month (limit/5 per day), then
 * a small overage (1% of limit per day) so they stay over quota. Rounded to nearest integer.
 */
function getDailyQuantity(
  tier: "free" | "paid" | "enterprise",
  usageLevel: "heavy" | "medium" | "light" | "extreme"
): number {
  const limit = PLAN_LIMITS[tier].prompts
  const jitter = 0.7 + 0.6 * Math.random() // [0.7, 1.3], mean 1.0

  if (usageLevel === "extreme") {
    const dayOfMonth = new Date().getDate()
    let baseDaily: number
    if (dayOfMonth <= EXTREME_DAYS_TO_HIT_QUOTA) {
      baseDaily = limit / EXTREME_DAYS_TO_HIT_QUOTA // 100% in 5 days
    } else {
      baseDaily = limit * 0.01 // 1% of limit per day = over-quota usage
    }
    return Math.max(1, Math.round(baseDaily * jitter))
  }

  const target = get30DayTarget(tier, usageLevel)
  const baseDaily = target / DAYS_IN_PERIOD
  return Math.max(1, Math.round(baseDaily * jitter))
}

async function readCompanies(): Promise<Company[]> {
  const fullPath = path.join(process.cwd(), COMPANIES_PATH)
  const raw = await fs.readFile(fullPath, "utf8")
  return JSON.parse(raw) as Company[]
}

function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return authHeader === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const apiKey = process.env.SCHEMATIC_SECRET_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "SCHEMATIC_SECRET_KEY not set" },
      { status: 500 }
    )
  }

  let companies: Company[]
  try {
    companies = await readCompanies()
  } catch (e) {
    console.error("Failed to read companies:", e)
    return NextResponse.json(
      { error: "Failed to read companies" },
      { status: 500 }
    )
  }

  const schematicClient = new SchematicClient({ apiKey })

  for (const company of companies) {
    const quantity = getDailyQuantity(company.tier, company.usageLevel)
    if (quantity > 0) {
      schematicClient.track({
        event: FEATURES.prompts,
        company: { id: company.id },
        user: { id: company.id },
        quantity,
      })
    }
  }

  await schematicClient.close()

  return NextResponse.json({ ok: true, companies: companies.length })
}
