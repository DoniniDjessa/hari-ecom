import { NextResponse } from "next/server"
import { getProducts, withPhotosFirst } from "@/lib/catalog"
import { toCard } from "@/lib/types"

// The light catalogue (what a product card shows) for the instant search, the favourites and the products
// seen lately. Kept like the catalogue (5 min, refreshed at once by the web app); the browser 1 min.
export const revalidate = 300

export async function GET() {
  const products = withPhotosFirst(await getProducts()).map(toCard)
  return NextResponse.json(products, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  })
}
