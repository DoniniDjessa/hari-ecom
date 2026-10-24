import "server-only"
import { cache } from "react"
import { unstable_cache } from "next/cache"
import { db } from "./db"
import type { SiteProduct, UniverseCard } from "./types"
import { UNIVERSES } from "./site"
import { getSiteContent } from "./backoffice"
import { isSiteImage } from "./content"

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
    image: key && key.startsWith("haritest/ecom/") ? `/api/img/${key}` : null,
    universe: r.universe || r.section || "",
    form: r.form ?? "",
    volume: r.volume ?? "",
    description: r.description ?? "",
    pitch: r.pitch ?? "",
    usage: r.usage ?? "",
    precautions: r.precautions ?? "",
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
    createdAt: r.created_at,
  }
}

/** Every product of the site (≈ 600: the whole list is read at once and filtered in memory), kept 5 min */
export const getProducts = cache(() => cachedProducts())

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
}, ["site-products"], { revalidate: 300, tags: ["products"] })

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
  return UNIVERSES.map((u) => {
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

/** Products with a website photo come first: the site looks finished while photos are being made */
export const withPhotosFirst = (ps: SiteProduct[]) => [...ps].sort((a, b) => Number(!!b.image) - Number(!!a.image))
