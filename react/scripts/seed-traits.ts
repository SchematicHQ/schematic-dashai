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
  usageLevel: "heavy" | "medium" | "light" | "extreme"
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
  seats: "user-seat",
  dataSources: "data-source",
} as const

// Plan limits
const PLAN_LIMITS = {
  free: {
    seats: 1,
    dataSources: 1,
  },
  paid: {
    seats: 5,
    dataSources: 3,
  },
  enterprise: {
    seats: 25, // 5x pro limit
    dataSources: 15, // 5x pro limit
  },
} as const

// Generate usage quantities based on tier, usage level, and feature type
function getUsageQuantity(
  tier: "free" | "paid" | "enterprise",
  usageLevel: "heavy" | "medium" | "light" | "extreme",
  featureType: "seats" | "dataSources"
): number {
  const limit = PLAN_LIMITS[tier][featureType]
  if (usageLevel === "extreme") return limit // 100% of quota

  let minPercent: number
  let maxPercent: number
  switch (usageLevel) {
    case "heavy":
      minPercent = 0.7
      maxPercent = 1.0
      break
    case "medium":
      minPercent = 0.3
      maxPercent = 0.7
      break
    case "light":
      minPercent = 0.05
      maxPercent = 0.3
      break
    default:
      return limit
  }
  const minUsage = Math.ceil(limit * minPercent)
  const maxUsage = Math.floor(limit * maxPercent)
  const randomValue = Math.min(1, Math.random() + 0.1)
  return Math.max(1, Math.floor(randomValue * (maxUsage - minUsage + 1)) + minUsage)
}

async function seedTraits() {
  const apiKey = process.env.SCHEMATIC_SECRET_KEY
  if (!apiKey) {
    console.error("SCHEMATIC_SECRET_KEY environment variable is required")
    process.exit(1)
  }

  const companies = await readCompanies()
  const schematicClient = new SchematicClient({ apiKey })

  console.log(`Starting to seed trait data for ${companies.length} companies...`)
  console.log(`This operation is idempotent and can be run multiple times safely.`)

  // Process companies for traits
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i]
    
    // Generate usage for seats and data sources
    const seatsUsage = getUsageQuantity(company.tier, company.usageLevel, "seats")
    const dataSourcesUsage = getUsageQuantity(company.tier, company.usageLevel, "dataSources")

    // Update company traits for seats and data sources (trait-based features)
    // This is idempotent - running multiple times will just update to the same values
    try {
      await schematicClient.companies.upsertCompany({
        keys: {
          id: company.id,
        },
        traits: {
          [FEATURES.seats]: seatsUsage,
          [FEATURES.dataSources]: dataSourcesUsage,
        },
      })
      // Sleep 200ms after trait call to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 200))
    } catch (error) {
      console.error(`  Error updating traits for company ${company.id}:`, error)
    }

    // Log progress every 10 companies
    if ((i + 1) % 10 === 0) {
      console.log(`  Processed ${i + 1}/${companies.length} companies...`)
    }
  }

  await schematicClient.close()

  console.log(`\nCompleted seeding trait data`)
}

seedTraits().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})

