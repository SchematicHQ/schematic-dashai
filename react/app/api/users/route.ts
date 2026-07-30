import { NextRequest, NextResponse } from "next/server"
import { SchematicClient } from "@schematichq/schematic-typescript-node"
import { COMPANY_LOOKUP } from "@/lib/constants"
import { readJsonStore, writeJsonStore } from "@/lib/json-store"

export const dynamic = "force-dynamic"

const USERS_BLOB_PATH = "data/users.json"
const USERS_FS_PATH = "data/users.json"

type UserRecord = { id: string; email: string; name: string; role: string; initials: string }

async function readUsers(): Promise<UserRecord[]> {
  return readJsonStore<UserRecord[]>(USERS_BLOB_PATH, USERS_FS_PATH)
}

async function writeUsers(users: UserRecord[]) {
  await writeJsonStore(USERS_BLOB_PATH, USERS_FS_PATH, users)
}

async function updateSchematicTrait(userCount: number) {
  const apiKey = process.env.SCHEMATIC_SECRET_KEY
  if (!apiKey) {
    console.warn("SCHEMATIC_SECRET_KEY not set, skipping trait update")
    return
  }

  try {
    const schematicClient = new SchematicClient({ apiKey })
    
    await schematicClient.companies.upsertCompany({
      keys: COMPANY_LOOKUP,
      traits: {
        "user-seat": userCount,
      },
    })

    await schematicClient.close()
  } catch (error) {
    console.error("Error updating Schematic trait:", error)
    // Don't throw - we don't want to fail the user operation if trait update fails
  }
}

export async function GET() {
  try {
    const users = await readUsers()
    return NextResponse.json(users, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, role, initials } = body

    if (!name || !email || !role) {
      return NextResponse.json(
        { message: "Missing required fields: name, email, role" },
        { status: 400 }
      )
    }

    const users = await readUsers()
    
    // Check if user with email already exists
    if (users.some((user) => user.email === email)) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Generate initials if not provided
    const userInitials = initials || name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

    // Generate new ID
    const newId = String(Math.max(...users.map((u) => parseInt(u.id) || 0), 0) + 1)

    const newUser = {
      id: newId,
      name,
      email,
      role,
      initials: userInitials,
    }

    users.push(newUser)
    await writeUsers(users)

    // Update Schematic trait with new user count
    await updateSchematicTrait(users.length)

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error("Error adding user:", error)
    return NextResponse.json(
      { message: "Failed to add user" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const email = searchParams.get("email")

    if (!id && !email) {
      return NextResponse.json(
        { message: "Missing required parameter: id or email" },
        { status: 400 }
      )
    }

    const users = await readUsers()
    const initialLength = users.length

    const filteredUsers = users.filter((user) => {
      if (id) return user.id !== id
      if (email) return user.email !== email
      return true
    })

    if (filteredUsers.length === initialLength) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      )
    }

    await writeUsers(filteredUsers)

    // Update Schematic trait with new user count
    await updateSchematicTrait(filteredUsers.length)

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { message: "Failed to delete user" },
      { status: 500 }
    )
  }
}

