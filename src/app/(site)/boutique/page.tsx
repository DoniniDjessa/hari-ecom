import type { Metadata } from "next"
import { getProducts, getUniverseCards, withPhotosFirst } from "@/lib/catalog"
import { universeBySlug } from "@/lib/site"
import { toCard } from "@/lib/types"
import { Catalogue } from "@/components/Catalogue"

export const revalidate = 300

type Params = Promise<{ univers?: string; q?: string; tri?: string }>

export async function generateMetadata({ searchParams }: { searchParams: Params }): Promise<Metadata> {
  const u = universeBySlug((await searchParams).univers ?? "")
  return { title: u ? `Soins ${u.name.toLowerCase()}` : "Boutique" }
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
