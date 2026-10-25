import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProducts, withPhotosFirst } from "@/lib/catalog"
import { abs, breadcrumbLd, NEEDS, needBySlug } from "@/lib/seo"
import { toCard } from "@/lib/types"
import { JsonLd } from "@/components/JsonLd"
import { ProductListing } from "@/components/ProductListing"

export const revalidate = 300

type Params = Promise<{ slug: string }>

export function generateStaticParams() {
  return NEEDS.map((n) => ({ slug: n.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const need = needBySlug((await params).slug)
  if (!need) return { title: "Page introuvable", robots: { index: false } }
  return {
    title: `${need.title} à Abidjan`,
    description: `${need.text} Livraison partout à Abidjan, paiement à la livraison.`.slice(0, 160),
    alternates: { canonical: `/besoins/${need.slug}` },
  }
}

export default async function NeedPage({ params }: { params: Params }) {
  const need = needBySlug((await params).slug)
  if (!need) notFound()
  const all = await getProducts()
  const products = withPhotosFirst(all.filter((p) => p.benefits.includes(need.benefit)))
  const others = NEEDS.filter((n) => n.slug !== need.slug && all.some((p) => p.benefits.includes(n.benefit)))
  return (
    <>
      <JsonLd data={[
        breadcrumbLd([{ name: "Accueil", path: "/" }, { name: "Besoins", path: "/besoins" }, { name: need.title, path: `/besoins/${need.slug}` }]),
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: need.title,
          description: need.text,
          url: abs(`/besoins/${need.slug}`),
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: products.length,
            itemListElement: products.slice(0, 30).map((p, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/produit/${p.slug}`), name: p.name })),
          },
        },
      ]} />
      <ProductListing
        crumbs={[{ name: "Accueil", href: "/" }, { name: "Besoins", href: "/besoins" }, { name: need.title }]}
        eyebrow="Votre besoin"
        title={`${need.title}.`}
        intro={need.text}
        products={products.map(toCard)}
        more={{ title: "Autres besoins", links: others.map((n) => ({ href: `/besoins/${n.slug}`, label: n.title })) }}
      />
    </>
  )
}
