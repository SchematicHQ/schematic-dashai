"use client"

import { useEffect, useState } from "react"

/** The current time in ms, updated every `intervalMs` while the caller is mounted. */
export function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
