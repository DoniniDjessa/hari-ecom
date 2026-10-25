import type { Metadata } from "next"
import { getProducts, getUniverseCards, withPhotosFirst } from "@/lib/catalog"
import { universeBySlug } from "@/lib/site"
import { toCard } from "@/lib/types"
import { Catalogue } from "@/components/Catalogue"

export const revalidate = 300

type Params = Promise<{ univers?: string; q?: string; tri?: string }>

export async function generateMetadata({ searchParams }: { searchParams: Params }): Promise<Metadata> {
  const params = await searchParams
  const u = universeBySlug(params.univers ?? "")
  // a search or a sort: same page as the shop for Google (no duplicate pages)
  if (params.q || params.tri) return { title: "Boutique", alternates: { canonical: u ? `/boutique?univers=${u.slug}` : "/boutique" }, robots: { index: false, follow: true } }
  return u
    ? {
        title: `Soins ${u.name.toLowerCase()} à Abidjan`,
        description: `${u.tagline} : tous nos soins ${u.name.toLowerCase()} authentiques, livrés partout à Abidjan avec paiement à la livraison.`,
        alternates: { canonical: `/boutique?univers=${u.slug}` },
      }
    : {
        title: "Boutique : tous nos soins",
        description: "Toute la boutique Hari Store : soins visage, corps, bébé et bien-être, authentiques et livrés partout à Abidjan.",
        alternates: { canonical: "/boutique" },
      }
}

export default async function Boutique({ searchParams }: { searchParams: Params }) {
  const params = await searchParams
  const [all, universes] = await Promise.all([getProducts(), getUniverseCards()])
  const products = withPhotosFirst(all).map(toCard)
  return (
    <Catalogue
      products={products}
      universes={universes.map(({ name, roundImage }) => ({ name, image: roundImage }))}
      initial={{ universe: universeBySlug(params.univers ?? "")?.name ?? "", q: params.q ?? "", sort: params.tri ?? "" }}
    />
  )
}
