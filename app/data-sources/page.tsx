"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, Plus, Check, Trash2, AlertCircle, ArrowUp } from "lucide-react"
import { useSchematicEntitlement } from "@schematichq/schematic-react"

interface DataSource {
  id: string
  name: string
  type: string
  status: string
  icon: string
}

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
  const [connectedSources, setConnectedSources] = useState<DataSource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [connectingName, setConnectingName] = useState<string | null>(null)

  const { featureAllocation: allocation } = useSchematicEntitlement("data-sources")
  // Only block when we have a numeric limit and we're at or over it (don't block if entitlement not configured)
  const atLimit = allocation != null && connectedSources.length >= allocation

  const fetchDataSources = async () => {
    try {
      const response = await fetch("/api/data-sources", { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setConnectedSources(data)
      }
    } catch (error) {
      console.error("Error fetching data sources:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDataSources()
  }, [])

  const handleConnect = async (source: (typeof availableSources)[0]) => {
    if (atLimit) return
    setConnectingName(source.name)
    try {
      const response = await fetch("/api/data-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: source.name,
          type: source.type,
          icon: source.icon,
        }),
      })
      if (response.ok) {
        const added = await response.json()
        setConnectedSources((prev) => [...prev, added])
      } else {
        const err = await response.json()
        alert(err.message || "Failed to connect")
      }
    } catch (error) {
      console.error("Error connecting data source:", error)
      alert("Failed to connect data source")
    } finally {
      setConnectingName(null)
    }
  }

  const handleDisconnect = async (id: string) => {
    if (!confirm("Remove this data source?")) return
    try {
      const response = await fetch(`/api/data-sources?id=${id}`, { method: "DELETE" })
      if (response.ok) {
        setConnectedSources((prev) => prev.filter((s) => s.id !== id))
      } else {
        const err = await response.json()
        alert(err.message || "Failed to remove")
      }
    } catch (error) {
      console.error("Error removing data source:", error)
      alert("Failed to remove data source")
    }
  }

  const connectedNames = new Set(connectedSources.map((s) => s.name))
  const limitLabel = allocation != null ? String(allocation) : "—"
  // Only show sources in the bottom list that aren't connected above
  const sourcesAvailableToAdd = availableSources.filter((s) => !connectedNames.has(s.name))

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Data Sources</h1>
            <p className="text-muted-foreground">Connect and manage your data sources</p>
          </div>

          {atLimit && (
            <div className="rounded-lg border border-violet-200 dark:border-violet-800/80 bg-violet-50/80 dark:bg-violet-950/40 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-violet-600 dark:text-violet-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-violet-900 dark:text-violet-100">Data source limit reached</p>
                  <p className="text-xs text-violet-700 dark:text-violet-300">Upgrade your plan to connect more data sources</p>
                </div>
              </div>
              <Button
                size="sm"
                className="gap-2 bg-violet-600 hover:bg-violet-700 text-white border-0 shrink-0"
                onClick={() => (window.location.href = "/pricing")}
              >
                <ArrowUp className="h-4 w-4" />
                Upgrade
              </Button>
            </div>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-accent" />
                <CardTitle className="text-lg">Connected Sources</CardTitle>
              </div>
              <CardDescription>Data sources currently integrated with your dashboards</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {connectedSources.map((source) => (
                      <div
                        key={source.id}
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground gap-1"
                            onClick={() => handleDisconnect(source.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{connectedSources.length} of {limitLabel}</span> data
                      sources used on your current plan
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Data Source</CardTitle>
              <CardDescription>Connect additional data sources to power your dashboards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {sourcesAvailableToAdd.map((source) => {
                  const isConnecting = connectingName === source.name
                  const canAdd = !atLimit && !isConnecting
                  return (
                    <div
                      key={source.name}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{source.icon}</span>
                        <div>
                          <p className="text-sm font-medium">{source.name}</p>
                          <p className="text-xs text-muted-foreground">{source.type}</p>
                        </div>
                      </div>
                      <Button
                        variant={canAdd ? "default" : "secondary"}
                        size="sm"
                        className="gap-1"
                        disabled={!canAdd}
                        onClick={() => handleConnect(source)}
                      >
                        <Plus className="h-3 w-3" />
                        {isConnecting ? "Connecting…" : "Connect"}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
