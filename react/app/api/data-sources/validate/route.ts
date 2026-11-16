import { after, NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { fakeValidateDataSourceCall } from "@/lib/fake-inference"
import { sendInferenceEvents } from "@/lib/inference-events"
import { INFERENCE_EVENTS } from "@/lib/models"

// Validates a connected data source with one (fake) model call. The
// validate-data-source feature burns a flat number of credits per call and
// leaves its token rates blank, so the price is fixed but Schematic still
// records the tokens and what the call cost.
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ message: "Sign in first" }, { status: 401 })
  }

  const { id } = (await request.json()) as { id?: string }
  if (!id) {
    return NextResponse.json({ message: "id is required" }, { status: 400 })
  }

  const call = fakeValidateDataSourceCall()
  after(() => sendInferenceEvents([call], { event: INFERENCE_EVENTS.validateDataSource, user: { clerkid: userId } }))

  const rowsChecked = 500 + Math.floor(Math.random() * 4500)
  const issues = Math.random() < 0.6 ? 0 : 1 + Math.floor(Math.random() * 3)
  return NextResponse.json({ id, rowsChecked, issues, call })
}
