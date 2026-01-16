import { AppHeader } from "@/components/app-header"

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">Pricing</h1>
          <p className="text-muted-foreground mb-8">Choose the plan that works for you</p>

          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">Pricing plans coming soon</p>
          </div>
        </div>
      </main>
    </div>
  )
}
