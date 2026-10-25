import "server-only"
import { unstable_cache } from "next/cache"
import { db } from "./db"

// Hari Gold rules, set in the web app (Paramètres › Hari Gold, hari-site-settings › "loyalty"). Kept like
// the site's texts (5 min, refreshed at once when the web app saves them).
export type LoyaltyRules = {
  active: boolean
  since: string
  /** "amount": points per 1 000 F; "purchases": 1 point per purchase */
  mode: "amount" | "purchases"
  perThousand: number
  /** points (or purchases) for a voucher */
  rewardPoints: number
  rewardValue: number
  /** smallest purchase that counts (F) */
  minPurchase: number
}

const n = (v: unknown, d: number, min = 0) => (Number.isFinite(Number(v)) && Number(v) > min ? Number(v) : d)

export const getLoyaltyRules = unstable_cache(async (): Promise<LoyaltyRules> => {
  const { data } = await db().from("hari-site-settings").select("value").eq("key", "loyalty").maybeSingle()
  const v = (data?.value ?? {}) as Record<string, unknown>
  return {
    active: v.active !== false,
    since: typeof v.since === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.since) ? v.since : "2026-11-01",
    mode: v.mode === "purchases" ? "purchases" : "amount",
    perThousand: n(v.pointsPer1000, 1),
    rewardPoints: Math.round(n(v.rewardPoints, 100)),
    rewardValue: n(v.rewardValue, 5000),
    minPurchase: n(v.minPurchase, 0, -1),
  }
}, ["site-loyalty"], { revalidate: 300, tags: ["site-content"] })

/** Points earned by one purchase of this amount */
export const pointsFor = (amount: number, r: LoyaltyRules) =>
  amount < r.minPurchase ? 0 : r.mode === "amount" ? Math.floor((amount / 1000) * r.perThousand) : 1
