"use client"

import Link from "next/link"
import { Database, CreditCard, Users, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"
import { CreditsBadge } from "@/components/credits-badge"

export function AppHeader() {
  return (
    <header className="border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <Sparkles className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="text-lg font-semibold">DashAI</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Builder
            </Link>
            <Link
              href="/team"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Users className="h-4 w-4" />
              Team
            </Link>
            <Link
              href="/data-sources"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Database className="h-4 w-4" />
              Data Sources
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <CreditsBadge />
          <Link href="/pricing">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Pricing
            </Button>
          </Link>
          <Link href="/plan">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <CreditCard className="h-4 w-4" />
              Plan
            </Button>
          </Link>
          <SignedOut>
            <SignInButton />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  )
}
