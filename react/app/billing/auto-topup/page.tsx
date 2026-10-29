"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AutoTopupEditor } from "@/components/billing/auto-topup-editor"

export default function AutoTopupPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-6 py-8 space-y-6">
        <div className="space-y-2">
          <Link
            href="/billing"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Billing
          </Link>
          <h1 className="text-2xl font-bold">Auto top-up</h1>
          <p className="text-sm text-muted-foreground">
            Refill credits before they run out, so work never stops mid-run.
          </p>
        </div>
        <AutoTopupEditor />
      </div>
    </div>
  )
}
