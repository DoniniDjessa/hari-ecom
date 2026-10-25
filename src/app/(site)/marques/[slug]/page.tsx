import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getBrands, getProducts, withPhotosFirst } from "@/lib/catalog"
import { abs, breadcrumbLd } from "@/lib/seo"
import { toCard } from "@/lib/types"
import { JsonLd } from "@/components/JsonLd"
import { ProductListing } from "@/components/ProductListing"

export const revalidate = 300

type Params = Promise<{ slug: string }>

// built on the first visit, then served from the cache (refreshed every 5 min, or at once by the web app)
export function generateStaticParams() {
  return []
}

async function load(slug: string) {
  const brand = (await getBrands()).find((b) => b.slug === slug)
  if (!brand) return null
  const products = withPhotosFirst((await getProducts()).filter((p) => p.brand.trim() === brand.name))
  return { brand, products }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await load((await params).slug)
  if (!data) return { title: "Marque introuvable", robots: { index: false } }
  const { brand, products } = data
  const forms = [...new Set(products.map((p) => p.form.toLowerCase()).filter(Boolean))].slice(0, 3).join(", ")
  return {
    title: `${brand.name} : soins et cosmétiques à Abidjan`,
    description: `${brand.count} produit${brand.count > 1 ? "s" : ""} ${brand.name}${forms ? ` (${forms})` : ""} authentiques chez Hari Store. Livraison partout à Abidjan, paiement à la livraison.`,
    alternates: { canonical: `/marques/${brand.slug}` },
  }
}

export default async function Brand({ params }: { params: Params }) {
  const data = await load((await params).slug)
  if (!data) notFound()
  const { brand, products } = data
  // the brand's other universes and needs, for the intro
  const universes = [...new Set(products.map((p) => p.universe.toLowerCase()).filter(Boolean))]
  const others = (await getBrands()).filter((b) => b.slug !== brand.slug).sort((a, b) => b.count - a.count).slice(0, 14)
  return (
    <>
      <JsonLd data={[
        breadcrumbLd([{ name: "Accueil", path: "/" }, { name: "Marques", path: "/marques" }, { name: brand.name, path: `/marques/${brand.slug}` }]),
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${brand.name} chez Hari Store`,
          url: abs(`/marques/${brand.slug}`),
          about: { "@type": "Brand", name: brand.name },
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: products.length,
            itemListElement: products.slice(0, 30).map((p, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/produit/${p.slug}`), name: p.name })),
          },
        },
      ]} />
      <ProductListing
        crumbs={[{ name: "Accueil", href: "/" }, { name: "Marques", href: "/marques" }, { name: brand.name }]}
        eyebrow="La marque"
        title={`${brand.name}.`}
        intro={`Tous les soins ${brand.name} disponibles chez Hari Store${universes.length ? ` : ${universes.join(", ")}` : ""}. Des produits authentiques, contrôlés dans nos boutiques d'Abidjan, livrés chez vous avec paiement à la livraison.`}
        products={products.map(toCard)}
        more={{ title: "D'autres marques", links: others.map((b) => ({ href: `/marques/${b.slug}`, label: b.name })) }}
      />
    </>
  )
}
