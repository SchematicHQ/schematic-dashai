"use client"

import { useEffect, useState } from "react"

type CreditBalance = {
  allocation: number
  usage: number
} | null

export function CreditsBadge() {
  const [balance, setBalance] = useState<CreditBalance>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch("/api/credit-balance")

        if (!res.ok) {
          throw new Error("Failed to fetch credit balance")
        }

        const data = (await res.json()) as CreditBalance
        setBalance(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalance()
  }, [])

  if (isLoading || !balance) {
    return null
  }

  const remaining = Math.max(0, (balance.allocation ?? 0) - (balance.usage ?? 0))

  return (
    <div className="inline-flex items-center rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
      <span className="mr-1 h-2 w-2 rounded-full bg-emerald-500" />
      <span>{remaining.toLocaleString()} credits remaining</span>
    </div>
  )
}

