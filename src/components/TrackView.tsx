"use client"

import { useEffect } from "react"
import { track } from "@/lib/track"
import { useRecent } from "./Saved"

/** On a product page: counts the view (statistics) and remembers it in "Vu récemment" */
export function TrackView({ product }: { product: { id: string; name: string; price: number; brand: string; universe: string } }) {
  const { see } = useRecent()
  useEffect(() => {
    track("view_item", { value: product.price, items: [{ id: product.id, name: product.name, price: product.price, brand: product.brand, category: product.universe }] })
    see(product.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id])
  return null
}
