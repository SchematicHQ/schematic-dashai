"use client"

import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, Plus, Check } from "lucide-react"

const connectedSources = [
  { name: "Postgres", type: "Database", status: "connected", icon: "🐘" },
  { name: "HubSpot", type: "CRM", status: "connected", icon: "🟠" },
]

const availableSources = [
  { name: "Snowflake", type: "Data Warehouse", icon: "❄️" },
  { name: "BigQuery", type: "Data Warehouse", icon: "📊" },
  { name: "MySQL", type: "Database", icon: "🐬" },
  { name: "MongoDB", type: "Database", icon: "🍃" },
  { name: "Salesforce", type: "CRM", icon: "☁️" },
  { name: "Stripe", type: "Payments", icon: "💳" },
  { name: "Google Analytics", type: "Analytics", icon: "📈" },
  { name: "Mixpanel", type: "Analytics", icon: "📉" },
]

export default function DataSourcesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Data Sources</h1>
            <p className="text-muted-foreground">Connect and manage your data sources</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-accent" />
                <CardTitle className="text-lg">Connected Sources</CardTitle>
              </div>
              <CardDescription>Data sources currently integrated with your dashboards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {connectedSources.map((source) => (
                  <div
                    key={source.name}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{source.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{source.name}</p>
                        <p className="text-xs text-muted-foreground">{source.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-green-500">Connected</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                        Configure
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">2 of 3</span> data sources used on your current plan
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Data Source</CardTitle>
              <CardDescription>Connect additional data sources to power your dashboards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {availableSources.map((source) => (
                  <div
                    key={source.name}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-accent/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{source.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{source.name}</p>
                        <p className="text-xs text-muted-foreground">{source.type}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Connect
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
