import { SchematicClient } from "@schematichq/schematic-typescript-node"
import { promises as fs } from "fs"
import path from "path"
import { config } from "dotenv"

// Load .env.local from parent directory (one level up from scripts folder)
config({ path: path.join(process.cwd(), ".env.local") })

const companiesFilePath = path.join(process.cwd(), "scripts", "companies.json")

interface Company {
  id: string
  name: string
  tier: "free" | "paid" | "enterprise"
  usageLevel: "heavy" | "medium" | "light"
}

async function readCompanies(): Promise<Company[]> {
  try {
    const fileContents = await fs.readFile(companiesFilePath, "utf8")
    return JSON.parse(fileContents)
  } catch (error) {
    console.error("Error reading companies file:", error)
    throw error
  }
}

// Feature IDs
const FEATURES = {
  prompts: "dashboard-prompt",
} as const

// Plan limits
const PLAN_LIMITS = {
  free: {
    prompts: 5,
  },
  paid: {
    prompts: 50,
  },
  enterprise: {
    prompts: 250, // 5x pro limit
  },
} as const

// Generate usage quantities based on tier, usage level, and feature type
function getUsageQuantity(
  tier: "free" | "paid" | "enterprise",
  usageLevel: "heavy" | "medium" | "light",
  featureType: "prompts"
): number {
  const limit = PLAN_LIMITS[tier][featureType]
  
  // Calculate usage as a percentage of the limit based on usage level
  let minPercent: number
  let maxPercent: number
  
  switch (usageLevel) {
    case "heavy":
      minPercent = 0.7 // 70-100% of limit
      maxPercent = 1.0
      break
    case "medium":
      minPercent = 0.3 // 30-70% of limit
      maxPercent = 0.7
      break
    case "light":
      minPercent = 0.05 // 5-30% of limit
      maxPercent = 0.3
      break
  }
  
  const minUsage = Math.ceil(limit * minPercent)
  const maxUsage = Math.floor(limit * maxPercent)
  
  // Add 0.1 to random number to push values higher
  const randomValue = Math.min(1, Math.random() + 0.1)
  return Math.max(1, Math.floor(randomValue * (maxUsage - minUsage + 1)) + minUsage)
}

async function seedEvents() {
  const apiKey = process.env.SCHEMATIC_SECRET_KEY
  if (!apiKey) {
    console.error("SCHEMATIC_SECRET_KEY environment variable is required")
    process.exit(1)
  }

  const companies = await readCompanies()
  const schematicClient = new SchematicClient({ apiKey })

  console.log(`Starting to seed event data for ${companies.length} companies...`)

  // Generate track events for prompts (event-based)
  const events = []
  
  // Process companies for events
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i]
    
    // Generate usage for prompts
    const promptsUsage = getUsageQuantity(company.tier, company.usageLevel, "prompts")
    
    // Create one track event for prompts (event-based feature) with total usage
    if (promptsUsage > 0) {
      events.push({
        eventType: "track" as const,
        body: {
          event: FEATURES.prompts,
          company: {
            id: company.id,
          },
          quantity: promptsUsage,
        },
      })
    }

    // Log progress every 10 companies
    if ((i + 1) % 10 === 0) {
      console.log(`  Processed ${i + 1}/${companies.length} companies...`)
    }
  }

  // Batch and send prompt events
  const batchSize = 100
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize)
    try {
      await schematicClient.events.createEventBatch({
        events: batch,
      })
    } catch (error) {
      console.error(`  Error tracking batch starting at index ${i}:`, error)
    }
  }

  // sleep to make sure events send. awaiting schematicClient.close() should be enough, but just in case.
  await new Promise((resolve) => setTimeout(resolve, 5000))

  await schematicClient.close()

  console.log(`\nCompleted seeding event data`)
}

seedEvents().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})

