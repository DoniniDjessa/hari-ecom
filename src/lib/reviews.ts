import "server-only"
import { unstable_cache } from "next/cache"
import { db } from "./db"

// Reviews left by the visitors on a product page (table hari-product-reviews:
// haritest/database/add-product-reviews.sql). The rating shown blends them with the product's base rating
// (web app › Produits › Note affichée), the base weighing as BASE_WEIGHT reviews: one bad review cannot
// sink a product at once. 4.8 then one 1/5 → 4.71 (not 2.9); ten 1/5 → 4.04.
// Rule (also checked in the action): a device leaves at most one review per product every 3 months.

/** the base rating counts as this many reviews (or as its own number of reviews if it says more) */
export const BASE_WEIGHT = 40
export const REVIEW_COOLDOWN_DAYS = 90

export type Review = { id: string; rating: number; author: string; comment: string; createdAt: string }
type Stats = { sum: number; count: number }

/** the rating shown: base and visitors' ratings blended; reviews: base number + the visitors' */
export function blendRating(base: number | null, baseReviews: number, s: Stats | undefined): { rating: number | null; reviews: number } {
  if (!s?.count) return { rating: base, reviews: baseReviews }
  if (base == null) return { rating: round1(s.sum / s.count), reviews: baseReviews + s.count }
  const w = Math.max(BASE_WEIGHT, baseReviews)
  return { rating: round1((base * w + s.sum) / (w + s.count)), reviews: baseReviews + s.count }
}
const round1 = (n: number) => Math.round(n * 10) / 10

const missing = (m: string) => /reviews|schema cache|does not exist/i.test(m)

/** per product: sum and number of the published ratings (kept 5 min, refreshed when a review is left) */
export const reviewStats = unstable_cache(async (): Promise<Record<string, Stats>> => {
  const out: Record<string, Stats> = {}
  const { data, error } = await db().from("hari-product-reviews").select("product_id, rating").eq("status", "published").limit(50000)
  if (error) {
    if (!missing(error.message)) console.error("Avis:", error.message)
    return out
  }
  for (const r of data ?? []) {
    const s = (out[r.product_id] ??= { sum: 0, count: 0 })
    s.sum += Number(r.rating) || 0
    s.count++
  }
  return out
}, ["site-review-stats"], { revalidate: 300, tags: ["reviews"] })

/** the latest published reviews of a product */
export const productReviews = unstable_cache(async (productId: string): Promise<Review[]> => {
  const { data, error } = await db().from("hari-product-reviews")
    .select("id, rating, author, comment, created_at")
    .eq("product_id", productId).eq("status", "published")
    .order("created_at", { ascending: false }).limit(30)
  if (error) {
    if (!missing(error.message)) console.error("Avis:", error.message)
    return []
  }
  return (data ?? []).map((r) => ({ id: r.id, rating: Number(r.rating), author: r.author ?? "", comment: r.comment ?? "", createdAt: r.created_at }))
}, ["site-product-reviews"], { revalidate: 300, tags: ["reviews"] })
