import { after, NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { fakeDashboardPromptCalls, type DashboardOptions } from "@/lib/fake-inference"
import { sendInferenceEvents } from "@/lib/inference-events"
import { INFERENCE_EVENTS, isModelId } from "@/lib/models"

// Generates a dashboard. DashAI fakes the model calls, but bills them the way a
// real app would: one inference event per call, priced per token by the
// dashboard-prompt feature's rates on the company's plan.
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ message: "Sign in first" }, { status: 401 })
  }

  const { prompt, model, options } = (await request.json()) as {
    prompt?: string
    model?: string
    options?: Partial<DashboardOptions>
  }
  if (!prompt?.trim()) {
    return NextResponse.json({ message: "prompt is required" }, { status: 400 })
  }
  if (!isModelId(model)) {
    return NextResponse.json({ message: "unknown model" }, { status: 400 })
  }

  const calls = fakeDashboardPromptCalls(model, prompt.trim(), {
    predictiveAnalytics: options?.predictiveAnalytics === true,
    anomalyDetection: options?.anomalyDetection === true,
    autoInsights: options?.autoInsights === true,
  })

  // Report usage after the response is sent, so billing stays off the request path.
  after(() => sendInferenceEvents(calls, { event: INFERENCE_EVENTS.dashboardPrompt, user: { clerkid: userId } }))

  return NextResponse.json({ calls })
}
