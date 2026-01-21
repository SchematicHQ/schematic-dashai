"use client"
import { PromptInput } from "@/components/prompt-input"
// import { GeneratedDashboard } from "@/components/generated-dashboard"

export default function HomePage() {
  // const [hasGenerated, setHasGenerated] = useState(false)
  // const [isGenerating, setIsGenerating] = useState(false)

  // const handleGenerate = () => {
  //   setIsGenerating(true)
  //   // Simulate generation delay
  //   setTimeout(() => {
  //     setIsGenerating(false)
  //     setHasGenerated(true)
  //   }, 2000)
  // }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 p-6">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Build dashboards with AI</h1>
            <p className="text-muted-foreground text-lg">Describe what you need and we&apos;ll generate it instantly</p>
          </div>
          <PromptInput />
        </div>
      </main>
    </div>
  )
}
