"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowUp, Sparkles, Brain, TrendingUp, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toggle } from "@/components/ui/toggle"
import { useSchematicEvents } from "@schematichq/schematic-react"

export function PromptInput() {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [predictiveAnalytics, setPredictiveAnalytics] = useState(false)
  const [anomalyDetection, setAnomalyDetection] = useState(false)
  const [autoInsights, setAutoInsights] = useState(true)
  const router = useRouter()
  const { track } = useSchematicEvents()

  const handleSubmit = () => {
    if (prompt.trim()) {
      setIsGenerating(true)
      
      track({
        event: "dashboard-prompt",
        quantity: Math.floor(Math.random() * 20) + 50,
      })
      
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="rounded-xl border border-border bg-card p-4">
        <Textarea
          placeholder="Describe the dashboard you want to build..."
          className="min-h-[120px] resize-none border-0 bg-transparent p-0 text-base focus-visible:ring-0 placeholder:text-muted-foreground"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
        />
        <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Model</span>
              <Select defaultValue="gpt-4">
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4 Turbo</SelectItem>
                  <SelectItem value="gpt-3.5">GPT-3.5</SelectItem>
                  <SelectItem value="claude">Claude 3</SelectItem>
                  <SelectItem value="gemini">Gemini Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Toggle
              pressed={predictiveAnalytics}
              onPressedChange={setPredictiveAnalytics}
              size="sm"
              className="gap-1.5 text-xs data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Predictive
            </Toggle>
            <Toggle
              pressed={anomalyDetection}
              onPressedChange={setAnomalyDetection}
              size="sm"
              className="gap-1.5 text-xs data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
            >
              <Zap className="h-3.5 w-3.5" />
              Anomaly Detection
            </Toggle>
            <Toggle
              pressed={autoInsights}
              onPressedChange={setAutoInsights}
              size="sm"
              className="gap-1.5 text-xs data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
            >
              <Brain className="h-3.5 w-3.5" />
              Auto-Insights
            </Toggle>
          </div>
          <Button onClick={handleSubmit} disabled={!prompt.trim() || isGenerating} className="gap-2">
            {isGenerating ? (
              <>
                <Sparkles className="h-4 w-4 animate-pulse" />
                Generating...
              </>
            ) : (
              <>
                Generate
                <ArrowUp className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 mt-4">
        <span className="text-xs text-muted-foreground">Try:</span>
        <button
          onClick={() => setPrompt("Sales performance dashboard with revenue trends")}
          className="text-xs text-accent hover:underline"
        >
          Sales dashboard
        </button>
        <span className="text-muted-foreground">·</span>
        <button
          onClick={() => setPrompt("User analytics with engagement metrics")}
          className="text-xs text-accent hover:underline"
        >
          User analytics
        </button>
        <span className="text-muted-foreground">·</span>
        <button
          onClick={() => setPrompt("Marketing campaign performance overview")}
          className="text-xs text-accent hover:underline"
        >
          Marketing metrics
        </button>
      </div>
    </div>
  )
}
