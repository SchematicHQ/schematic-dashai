import { AppHeader } from "@/components/app-header"

export default function BillingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">Billing</h1>
          <p className="text-muted-foreground mb-8">Manage your subscription and payment methods</p>

          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">Billing content coming soon</p>
          </div>
        </div>
      </main>
    </div>
  )
}
