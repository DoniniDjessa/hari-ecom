"use server"

import { headers } from "next/headers"
import { db } from "@/lib/db"
import { getLoyaltyRules } from "@/lib/loyalty"

// "Mes points Hari Gold": the balance of a phone number. Only numbers are shown (no name, no order), and
// lookups are limited per address: the page cannot be used to learn about other clients.
const recent = new Map<string, number[]>()

export type Balance = { points: number; vouchers: number; value: number; toNext: number; orders: number }

export async function checkPoints(phone: string): Promise<{ ok: true; balance: Balance } | { ok: false; error: string }> {
  const digits = String(phone ?? "").replace(/\D/g, "")
  if (digits.length < 10) return { ok: false, error: "Entrez votre numéro à 10 chiffres (ex. 07 07 07 07 07)." }

  const h = await headers()
  const who = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local"
  const times = (recent.get(who) ?? []).filter((t) => t > Date.now() - 10 * 60_000)
  if (times.length >= 8) return { ok: false, error: "Trop de recherches. Réessayez dans quelques minutes." }
  recent.set(who, [...times, Date.now()])

  const rules = await getLoyaltyRules()
  if (!rules.active) return { ok: false, error: "Le programme Hari Gold ouvre bientôt." }
  const { data, error } = await db().rpc("hari_loyalty", { p_phone: digits, p_since: `${rules.since}T00:00:00Z`, p_min: rules.minPurchase })
  if (error) {
    console.error("Hari Gold:", error.message)
    return { ok: false, error: /hari_loyalty|function/.test(error.message) ? "Le programme Hari Gold ouvre bientôt." : "Service indisponible, réessayez." }
  }
  const row = (Array.isArray(data) ? data[0] : data) as { spent: number; orders: number; used: number } | undefined
  const earned = rules.mode === "amount" ? Math.floor((Number(row?.spent ?? 0) / 1000) * rules.perThousand) : Number(row?.orders ?? 0)
  const points = Math.max(0, earned - Number(row?.used ?? 0))
  const vouchers = Math.floor(points / rules.rewardPoints)
  return {
    ok: true,
    balance: {
      points,
      vouchers,
      value: vouchers * rules.rewardValue,
      toNext: rules.rewardPoints - (points % rules.rewardPoints),
      orders: Number(row?.orders ?? 0),
    },
  }
}
