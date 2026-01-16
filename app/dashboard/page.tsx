import { AppHeader } from "@/components/app-header"
import { GeneratedDashboard } from "@/components/generated-dashboard"

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <GeneratedDashboard />
        </div>
      </main>
    </div>
  )
}
