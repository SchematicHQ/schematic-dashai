import { NextRequest, NextResponse } from "next/server"
import { SchematicClient } from "@schematichq/schematic-typescript-node"
import { readJsonStore, writeJsonStore } from "@/lib/json-store"

export const dynamic = "force-dynamic"

const DATA_SOURCES_BLOB_PATH = "data/data-sources.json"
const DATA_SOURCES_FS_PATH = "data/data-sources.json"
const COMPANY_ID = "demo"

type DataSourceRecord = { id: string; name: string; type: string; status: string; icon: string }

async function readDataSources(): Promise<DataSourceRecord[]> {
  return readJsonStore<DataSourceRecord[]>(DATA_SOURCES_BLOB_PATH, DATA_SOURCES_FS_PATH)
}

async function writeDataSources(sources: DataSourceRecord[]) {
  await writeJsonStore(DATA_SOURCES_BLOB_PATH, DATA_SOURCES_FS_PATH, sources)
}

async function updateSchematicTrait(dataSourceCount: number) {
  const apiKey = process.env.SCHEMATIC_SECRET_KEY
  if (!apiKey) {
    console.warn("SCHEMATIC_SECRET_KEY not set, skipping trait update")
    return
  }

  try {
    const schematicClient = new SchematicClient({ apiKey })

    await schematicClient.companies.upsertCompany({
      keys: {
        id: COMPANY_ID,
      },
      traits: {
        "data-source": dataSourceCount,
      },
    })

    await schematicClient.close()
  } catch (error) {
    console.error("Error updating Schematic trait:", error)
    // Don't throw - we don't want to fail the operation if trait update fails
  }
}

export async function GET() {
  try {
    const sources = await readDataSources()
    return NextResponse.json(sources, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    })
  } catch (error) {
    console.error("Error fetching data sources:", error)
    return NextResponse.json(
      { message: "Failed to fetch data sources" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, icon } = body

    if (!name || !type) {
      return NextResponse.json(
        { message: "Missing required fields: name, type" },
        { status: 400 }
      )
    }

    const sources = await readDataSources()

    if (sources.some((s) => s.name === name)) {
      return NextResponse.json(
        { message: "A data source with this name already exists" },
        { status: 409 }
      )
    }

    const newId = String(
      Math.max(...sources.map((s) => parseInt(s.id) || 0), 0) + 1
    )

    const newSource = {
      id: newId,
      name,
      type,
      status: "connected",
      icon: icon || "📎",
    }

    sources.push(newSource)
    await writeDataSources(sources)

    await updateSchematicTrait(sources.length)

    return NextResponse.json(newSource, { status: 201 })
  } catch (error) {
    console.error("Error adding data source:", error)
    return NextResponse.json(
      { message: "Failed to add data source" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const name = searchParams.get("name")

    if (!id && !name) {
      return NextResponse.json(
        { message: "Missing required parameter: id or name" },
        { status: 400 }
      )
    }

    const sources = await readDataSources()
    const initialLength = sources.length

    const filtered = sources.filter((s) => {
      if (id) return s.id !== id
      if (name) return s.name !== name
      return true
    })

    if (filtered.length === initialLength) {
      return NextResponse.json(
        { message: "Data source not found" },
        { status: 404 }
      )
    }

    await writeDataSources(filtered)

    await updateSchematicTrait(filtered.length)

    return NextResponse.json({ message: "Data source removed successfully" })
  } catch (error) {
    console.error("Error deleting data source:", error)
    return NextResponse.json(
      { message: "Failed to delete data source" },
      { status: 500 }
    )
  }
}
