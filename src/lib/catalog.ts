import "server-only"
import { cache } from "react"
import { unstable_cache } from "next/cache"
import { db } from "./db"
import type { SiteProduct, UniverseCard } from "./types"
import { UNIVERSES } from "./site"
import { getSiteContent } from "./backoffice"
import { inUniverseOrder, isSiteImage } from "./content"

// SITE_PREVIEW_ALL=true: every active product, before "Afficher sur le site" is ticked in the web app
const PREVIEW_ALL = process.env.SITE_PREVIEW_ALL === "true"

type Row = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80)

/** /produit/HT00500-bain-eclaircissant-… : the code (before the first "-") finds the product */
export const codeFromSlug = (slug: string) => decodeURIComponent(slug).split("-")[0].toUpperCase()

const list = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()) : [])

function toSiteProduct(r: Row): SiteProduct {
  const key: string | null = r.ecom_image_key ?? null
  const stock = ((r.stock ?? []) as Row[]).reduce((sum, s) => sum + Number(s.quantity || 0), 0)
  return {
    id: r.id,
    code: r.code ?? "",
    slug: `${r.code}-${slugify(r.name)}`,
    name: r.name,
    brand: r.brand ?? "",
    price: Number(r.price) || 0,
    oldPrice: null,
    promoEnds: null,
    image: key && key.startsWith("haritest/ecom/") ? `/api/img/${key}` : null,
    universe: r.universe || r.section || "",
    form: r.form ?? "",
    volume: r.volume ?? "",
    description: r.description ?? "",
    pitch: r.pitch ?? "",
    usage: r.usage ?? "",
    moments: list(r.moments),
    precautions: r.precautions ?? "",
    alertIngredients: list(r.alert_ingredients),
    range: r.range_name ?? "",
    benefits: list(r.benefits),
    skinTypes: list(r.skin_types),
    hairTypes: list(r.hair_types),
    targets: list(r.targets),
    keyIngredients: list(r.key_ingredients),
    lots: (Array.isArray(r.lot_prices) ? r.lot_prices : [])
      .map((l: Row) => ({ quantity: Number(l.quantity), price: Number(l.price) }))
      .filter((l: { quantity: number; price: number }) => l.quantity > 1 && l.price > 0),
    isNew: !!r.site_new, // the site's own "Nouveau" (is_new is set by the app on every new product)
    bestseller: !!r.site_bestseller,
    featured: !!r.site_featured,
    spotlight: !!r.site_spotlight,
    badge: typeof r.site_badge === "string" ? r.site_badge.trim() : "",
    rating: r.site_rating == null ? null : Number(r.site_rating),
    reviews: Number(r.site_reviews) || 0,
    inStock: stock > 0,
    stock,
    createdAt: r.created_at,
  }
}

/** Every product of the site (≈ 600: the whole list is read at once and filtered in memory), kept 5 min.
 *  The flash sales of the web app are applied at each read: a sale starts and ends on time. */
export const getProducts = cache(async (): Promise<SiteProduct[]> => {
  const [products, flash] = await Promise.all([cachedProducts(), flashPrices()])
  if (!flash.size) return products
  return products.map((p) => {
    const f = flash.get(p.id)
    return f && f.price < p.price ? { ...p, price: f.price, oldPrice: p.price, promoEnds: f.endsAt } : p
  })
})

/** Flash sales not over yet (web app › Paramètres › Ventes flash), kept 5 min (refreshed by the web app) */
const cachedFlashSales = unstable_cache(async (): Promise<{ startsAt: string; endsAt: string; items: { id: string; price: number }[] }[]> => {
  const { data, error } = await db()
    .from("hari-flash-sales")
    .select("starts_at, ends_at, items:hari-flash-sale-items(product_id, flash_price)" as string)
    .eq("active", true)
    .gt("ends_at", new Date().toISOString())
  if (error) {
    if (!/flash|schema cache|does not exist/i.test(error.message)) console.error("Ventes flash:", error.message)
    return []
  }
  return ((data ?? []) as unknown as Row[]).map((s) => ({
    startsAt: s.starts_at,
    endsAt: s.ends_at,
    items: ((s.items ?? []) as Row[]).map((i) => ({ id: i.product_id, price: Number(i.flash_price) })),
  }))
}, ["site-flash-sales"], { revalidate: 300, tags: ["products"] })

/** Flash price of each product right now (the lowest when two sales overlap) */
export async function flashPrices(): Promise<Map<string, { price: number; endsAt: string }>> {
  const now = Date.now()
  const map = new Map<string, { price: number; endsAt: string }>()
  for (const s of await cachedFlashSales()) {
    if (new Date(s.startsAt).getTime() > now || new Date(s.endsAt).getTime() <= now) continue
    for (const i of s.items) {
      const current = map.get(i.id)
      if (i.price >= 0 && (!current || i.price < current.price)) map.set(i.id, { price: i.price, endsAt: s.endsAt })
    }
  }
  return map
}

const cachedProducts = unstable_cache(async (): Promise<SiteProduct[]> => {
  let query = db()
    .from("hari-products")
    .select("*, stock:hari-stock(quantity)")
    .eq("active", true)
    .gt("price", 0)
    .order("created_at", { ascending: false })
  if (!PREVIEW_ALL) query = query.eq("on_site", true)
  const { data, error } = await query
  if (error) {
    // e.g. on_site missing: haritest/database/add-ecom-site.sql not run yet
    console.error("Catalogue:", error.message)
    return []
  }
  return (data as Row[]).map(toSiteProduct)
}, ["site-products-v4"], { revalidate: 300, tags: ["products"] }) // v4: stock left

export async function getProduct(slug: string) {
  const code = codeFromSlug(slug)
  return (await getProducts()).find((p) => p.code === code) ?? null
}

/** Same universe first (same form before the others), never the product itself */
export function related(all: SiteProduct[], p: SiteProduct, n = 8) {
  const score = (o: SiteProduct) => (o.universe === p.universe ? 2 : 0) + (o.form === p.form ? 1 : 0) + (o.image ? 0.5 : 0)
  return all.filter((o) => o.id !== p.id && o.universe === p.universe).sort((a, b) => score(b) - score(a)).slice(0, n)
}

/** Every universe (even without products online yet), each with its count, photos (a featured product's first) and the
 *  tagline / round image set in the backoffice */
export async function getUniverseCards(): Promise<UniverseCard[]> {
  const [all, content] = await Promise.all([getProducts(), getSiteContent()])
  return inUniverseOrder(UNIVERSES, content.universeOrder).map((u) => {
    const custom = content.universes[u.slug]
    const ps = all.filter((p) => p.universe === u.name)
    const pick = ps.find((p) => p.image && p.featured) ?? ps.find((p) => p.image) ?? null
    return {
      ...u,
      tagline: custom?.tagline || u.tagline,
      roundImage: custom?.image && isSiteImage(custom.image) ? custom.image : null,
      count: ps.length,
      image: pick?.image ?? null,
      images: [pick, ...ps.filter((p) => p.image && p !== pick)].filter((p): p is SiteProduct => !!p?.image).slice(0, 3)
        .map((p) => ({ src: p.image!, name: p.name })),
      productName: pick?.name ?? "",
      productSlug: pick?.slug ?? "",
      forms: [...new Set(ps.map((p) => p.form).filter(Boolean))].slice(0, 4),
    }
  })
}

/** The brands that have products on the site, A → Z, with their page /marques/<slug> */
export async function getBrands(): Promise<{ name: string; slug: string; count: number }[]> {
  const counts = new Map<string, number>()
  for (const p of await getProducts()) if (p.brand.trim()) counts.set(p.brand.trim(), (counts.get(p.brand.trim()) ?? 0) + 1)
  return [...counts].map(([name, count]) => ({ name, slug: slugify(name), count }))
    .filter((b) => b.slug)
    .sort((a, b) => a.name.localeCompare(b.name, "fr"))
}

/** Products with a website photo come first: the site looks finished while photos are being made */
export const withPhotosFirst = (ps: SiteProduct[]) => [...ps].sort((a, b) => Number(!!b.image) - Number(!!a.image))
