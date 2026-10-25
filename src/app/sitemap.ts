import type { MetadataRoute } from "next"
import { getBrands, getProducts } from "@/lib/catalog"
import { getPacks } from "@/lib/packs"
import { abs, NEEDS } from "@/lib/seo"
import { UNIVERSES } from "@/lib/site"

// /sitemap.xml: every public page, so Google finds the ~600 products, the brands and the needs at once.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, packs, brands] = await Promise.all([getProducts(), getPacks(), getBrands()])
  const needs = NEEDS.filter((n) => products.some((p) => p.benefits.includes(n.benefit)))
  const now = new Date()
  const page = (path: string, priority: number, changeFrequency: "daily" | "weekly" | "monthly" | "yearly" = "weekly", lastModified: Date = now) =>
    ({ url: abs(path), lastModified, changeFrequency, priority })

  return [
    page("/", 1, "daily"),
    page("/boutique", 0.9, "daily"),
    ...UNIVERSES.map((u) => page(`/boutique?univers=${u.slug}`, 0.8, "daily")),
    page("/packs", 0.8),
    ...packs.map((p) => page(`/packs/${p.slug}`, 0.7)),
    page("/marques", 0.7),
    ...brands.map((b) => page(`/marques/${b.slug}`, 0.6)),
    page("/besoins", 0.7),
    ...needs.map((n) => page(`/besoins/${n.slug}`, 0.7)),
    page("/diagnostic", 0.6, "monthly"),
    page("/fidelite", 0.4, "monthly"),
    ...products.map((p) => page(`/produit/${p.slug}`, p.image ? 0.8 : 0.5, "weekly", new Date(p.createdAt))),
    page("/livraison-retours", 0.3, "yearly"),
    page("/cgv", 0.2, "yearly"),
    page("/mentions-legales", 0.1, "yearly"),
    page("/confidentialite", 0.1, "yearly"),
  ]
}
