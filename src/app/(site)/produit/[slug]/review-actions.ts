"use server"

import { createHash, randomUUID } from "crypto"
import { cookies, headers } from "next/headers"
import { updateTag } from "next/cache"
import { db } from "@/lib/db"
import { REVIEW_COOLDOWN_DAYS } from "@/lib/reviews"

// A visitor leaves a review (1 to 5 stars + an optional comment) on a product page. The device is known by
// a random id kept in an httpOnly cookie (2 years); it may review a product again only 3 months after its
// last review of it. Addresses: at most 5 reviews an hour (in memory), and a hash of the address is kept
// so the shop can spot abuse. The rating shown blends the reviews with the base rating (lib/reviews.ts).

const COOKIE = "hari-device"
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const recent = new Map<string, number[]>()
const missing = (m: string) => /reviews|schema cache|does not exist/i.test(m)

export type ReviewState = { canReview: true } | { canReview: false; until: string }

async function deviceId(create: boolean): Promise<string | null> {
  const jar = await cookies()
  const current = jar.get(COOKIE)?.value
  if (current && uuid.test(current)) return current
  if (!create) return null
  const id = randomUUID()
  jar.set(COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 2 * 365 * 24 * 3600 })
  return id
}

/** the end of the 3 months after this device's last review of the product, if not over yet */
async function blockedUntil(productId: string, device: string): Promise<string | null> {
  const since = new Date(Date.now() - REVIEW_COOLDOWN_DAYS * 86_400_000).toISOString()
  const { data, error } = await db().from("hari-product-reviews").select("created_at")
    .eq("product_id", productId).eq("device_id", device).gt("created_at", since)
    .order("created_at", { ascending: false }).limit(1)
  if (error || !data?.length) return null
  return new Date(new Date(data[0].created_at).getTime() + REVIEW_COOLDOWN_DAYS * 86_400_000).toISOString()
}

/** may this device review the product now? (asked when the page opens) */
export async function getReviewState(productId: string): Promise<ReviewState> {
  if (!uuid.test(productId)) return { canReview: true }
  const device = await deviceId(false)
  const until = device ? await blockedUntil(productId, device) : null
  return until ? { canReview: false, until } : { canReview: true }
}

export async function leaveReview(input: { productId: string; rating: number; author: string; comment: string }): Promise<
  { ok: true; id: string; createdAt: string } | { ok: false; error: string; until?: string }
> {
  const productId = String(input.productId ?? "")
  const rating = Math.round(Number(input.rating))
  const author = String(input.author ?? "").trim().replace(/\s+/g, " ").slice(0, 60)
  const comment = String(input.comment ?? "").trim().slice(0, 1000)
  if (!uuid.test(productId)) return { ok: false, error: "Produit introuvable." }
  if (!(rating >= 1 && rating <= 5)) return { ok: false, error: "Choisissez une note de 1 à 5 étoiles." }
  if (author.length < 2) return { ok: false, error: "Indiquez votre prénom." }
  if (/https?:\/\/|www\./i.test(comment + author)) return { ok: false, error: "Les liens ne sont pas acceptés dans un avis." }

  const h = await headers()
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local"
  const times = (recent.get(ip) ?? []).filter((t) => t > Date.now() - 3_600_000)
  if (times.length >= 5) return { ok: false, error: "Trop d'avis en peu de temps. Réessayez plus tard." }

  const { data: product } = await db().from("hari-products").select("id").eq("id", productId).eq("active", true).maybeSingle()
  if (!product) return { ok: false, error: "Produit introuvable." }

  const device = (await deviceId(true))!
  const until = await blockedUntil(productId, device)
  if (until) return { ok: false, error: "Vous avez déjà donné votre avis sur ce produit.", until }

  const { data, error } = await db().from("hari-product-reviews")
    .insert({
      product_id: productId, rating, author, comment, device_id: device,
      ip_hash: createHash("sha256").update(`${ip}|${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`).digest("hex").slice(0, 32),
    })
    .select("id, created_at").single()
  if (error || !data) {
    console.error("Avis:", error?.message)
    return { ok: false, error: error && missing(error.message) ? "Les avis ne sont pas encore ouverts. Réessayez bientôt." : "L'avis n'a pas pu être enregistré. Réessayez." }
  }
  times.push(Date.now())
  recent.set(ip, times)
  // the new rating and review show at once (product page, cards)
  updateTag("reviews")
  return { ok: true, id: data.id, createdAt: data.created_at }
}
