import { NextRequest, NextResponse } from "next/server"
import { SchematicClient } from "@schematichq/schematic-typescript-node"
import { promises as fs } from "fs"
import path from "path"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const DAYS_IN_PERIOD = 30
const COMPANIES_PATH = "scripts/companies.json"
const DECIMALS = 4

function round4(n: number): number {
  return Math.round(n * 10 ** DECIMALS) / 10 ** DECIMALS
}

interface Company {
  id: string
  name: string
  tier: "free" | "paid" | "enterprise"
  usageLevel: "heavy" | "medium" | "light"
}

const FEATURES = { prompts: "dashboard-prompt" } as const

const PLAN_LIMITS = {
  free: { prompts: 5 },
  paid: { prompts: 50 },
  enterprise: { prompts: 250 },
} as const

/**
 * Target usage over 30 days (midpoint of the usage band). Fractional, rounded to 4 decimals.
 */
function get30DayTarget(
  tier: "free" | "paid" | "enterprise",
  usageLevel: "heavy" | "medium" | "light"
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
  }
  return round4(Math.max(0.0001, limit * midPercent))
}

/**
 * Per-day quantity with jitter: base = target/30, then multiplied by a random
 * factor in [0.7, 1.3] so each run produces slightly different amounts while
 * 30-day totals still average to the target. Rounded to 4 decimals.
 */
function getDailyQuantity(
  tier: "free" | "paid" | "enterprise",
  usageLevel: "heavy" | "medium" | "light"
): number {
  const target = get30DayTarget(tier, usageLevel)
  const baseDaily = target / DAYS_IN_PERIOD
  const jitter = 0.7 + 0.6 * Math.random() // [0.7, 1.3], mean 1.0
  return round4(Math.max(0.0001, baseDaily * jitter))
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

  const events = companies
    .map((company) => {
      const quantity = getDailyQuantity(company.tier, company.usageLevel)
      return {
        eventType: "track" as const,
        body: {
          event: FEATURES.prompts,
          company: { id: company.id },
          quantity,
        },
      }
    })
    .filter((e) => e.body.quantity > 0)

  const schematicClient = new SchematicClient({ apiKey })
  const batchSize = 100
  let failed = 0

  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize)
    try {
      await schematicClient.events.createEventBatch({ events: batch })
    } catch (error) {
      console.error(`Event batch failed at index ${i}:`, error)
      failed += batch.length
    }
  }

  await schematicClient.close()

  return NextResponse.json({
    ok: true,
    companies: companies.length,
    eventsSent: events.length - failed,
    failed,
  })
}
