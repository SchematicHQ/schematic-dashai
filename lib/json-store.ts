import { get, put } from "@vercel/blob"
import { promises as fs } from "fs"
import path from "path"

const token = process.env.BLOB_READ_WRITE_TOKEN

/**
 * Reads a JSON array from storage. On Vercel (when BLOB_READ_WRITE_TOKEN is set),
 * uses Blob storage so data persists. Locally or when token is missing, uses the
 * file at fsPath. If the blob doesn't exist yet, falls back to the file (seed data).
 */
export async function readJsonStore<T = unknown[]>(
  blobPathname: string,
  fsPath: string
): Promise<T> {
  const defaultData = async (): Promise<T> => {
    try {
      const fullPath = path.join(process.cwd(), fsPath)
      const fileContents = await fs.readFile(fullPath, "utf8")
      return JSON.parse(fileContents) as T
    } catch {
      return [] as T
    }
  }

  if (!token) {
    return defaultData()
  }

  try {
    const result = await get(blobPathname, { access: "private", useCache: false })
    if (!result || result.statusCode !== 200 || !result.stream) {
      return defaultData()
    }
    const text = await new Response(result.stream).text()
    return JSON.parse(text || "[]") as T
  } catch {
    return defaultData()
  }
}

/**
 * Writes a JSON array to storage. On Vercel uses Blob (persistent); locally uses the file.
 */
export async function writeJsonStore(
  blobPathname: string,
  fsPath: string,
  data: unknown[]
): Promise<void> {
  const payload = JSON.stringify(data, null, 2)

  if (!token) {
    const fullPath = path.join(process.cwd(), fsPath)
    await fs.writeFile(fullPath, payload, "utf8")
    return
  }

  await put(blobPathname, payload, {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
  })
}
