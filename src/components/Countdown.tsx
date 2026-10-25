"use client"

import { useEffect, useState } from "react"

/** "Se termine dans 2 j 04 h 12 min" until `until` (ISO), then nothing */
export function Countdown({ until, className }: { until: string; className?: string }) {
  const end = new Date(until).getTime()
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  if (now === null || end <= now) return null
  const m = Math.floor((end - now) / 60_000)
  const d = Math.floor(m / 1440)
  const h = Math.floor((m % 1440) / 60)
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    <span className={className}>
      Se termine dans {d > 0 && `${d} j `}{pad(h)} h {pad(m % 60)} min
    </span>
  )
}
