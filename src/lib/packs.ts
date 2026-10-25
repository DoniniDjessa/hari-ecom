import "server-only"
import { cache } from "react"
import { unstable_cache } from "next/cache"
import { db } from "./db"
import { slugify } from "./catalog"
import type { SitePack } from "./types"

// Packs created in the web app (Paramètres › Packs): only the ones shown on the site (active). A pack is
// in stock when every product of it is, in the quantity of the pack.

type Row = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

const img = (key: string | null | undefined) => (key && key.startsWith("haritest/ecom/") ? `/api/img/${key}` : null)

const cachedPacks = unstable_cache(async (): Promise<SitePack[]> => {
  const { data, error } = await db()
    .from("hari-packs")
    .select("*, items:hari-pack-items(quantity, product:hari-products(id, code, name, brand, price, ecom_image_key, active, stock:hari-stock(quantity)))" as string)
    .eq("active", true)
    .order("created_at", { ascending: false })
  if (error) {
    // hari-packs missing: haritest/database/add-ecom-packs-site.sql not run yet
    console.error("Packs:", error.message)
    return []
  }
  return ((data ?? []) as Row[]).map((r) => {
    const items = ((r.items ?? []) as Row[])
      .filter((i) => i.product?.active)
      .map((i) => {
        const p = i.product as Row
        const stock = ((p.stock ?? []) as Row[]).reduce((n, s) => n + Number(s.quantity || 0), 0)
        return {
          id: p.id as string,
          slug: `${p.code}-${slugify(p.name)}`,
          name: p.name as string,
          brand: (p.brand ?? "") as string,
          price: Number(p.price) || 0,
          image: img(p.ecom_image_key),
          quantity: Number(i.quantity) || 1,
          inStock: stock >= (Number(i.quantity) || 1),
        }
      })
    const value = items.reduce((n, i) => n + i.price * i.quantity, 0)
    const price = Number(r.price) || 0
    return {
      id: r.id,
      slug: `${slugify(r.name)}-${String(r.id).slice(0, 8)}`,
      name: r.name,
      description: r.description ?? "",
      badge: typeof r.badge === "string" ? r.badge.trim() : "",
      price,
      value,
      saving: value > price ? value - price : 0,
      image: img(r.image_key),
      items,
      inStock: items.length > 0 && items.every((i) => i.inStock),
    }
  }).filter((p) => p.items.length > 0)
}, ["site-packs"], { revalidate: 300, tags: ["packs"] })

export const getPacks = cache(() => cachedPacks())

/** /packs/rituel-eclat-1a2b3c4d : the end of the address is the start of the pack's id */
export async function getPack(slug: string) {
  const short = decodeURIComponent(slug).split("-").pop() ?? ""
  return (await getPacks()).find((p) => p.id.startsWith(short)) ?? null
}
