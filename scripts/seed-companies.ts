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

async function seedCompanies() {
  const apiKey = process.env.SCHEMATIC_SECRET_KEY
  if (!apiKey) {
    console.error("SCHEMATIC_SECRET_KEY environment variable is required")
    process.exit(1)
  }

  const companies = await readCompanies()
  const schematicClient = new SchematicClient({ apiKey })

  console.log(`Starting to seed ${companies.length} companies...`)

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i]
    try {
      // Create identify event with company information
      await schematicClient.identify({
        keys: {
          id: company.id,
        },
        name: company.name,
        company: {
          keys: {
            id: company.id,
          },
          name: company.name,
        },
      })
      
      // Log progress every 10 companies
      if ((i + 1) % 10 === 0) {
        console.log(`  Processed ${i + 1}/${companies.length} companies...`)
      }
    } catch (error) {
      console.error(`  Error identifying company ${company.id}:`, error)
    }
  }

  // sleep to make sure events send. awaiting schematicClient.close() should be enough, but just in case.
  await new Promise((resolve) => setTimeout(resolve, 5000));

  await schematicClient.close()

  console.log(`\nCompleted seeding companies`)
}

seedCompanies().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})

