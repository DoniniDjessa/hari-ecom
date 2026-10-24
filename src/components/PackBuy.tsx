"use client"

import { useRouter } from "next/navigation"
import type { SitePack } from "@/lib/types"
import { formatPrice } from "@/lib/site"
import { useCart } from "./CartProvider"
import { PlusIcon } from "./icons"

export function PackBuy({ pack: p }: { pack: SitePack }) {
  const { addPack } = useCart()
  const router = useRouter()
  if (!p.inStock) {
    return <p style={{ margin: "26px 0 8px", padding: "14px 18px", background: "var(--surface-2)", fontWeight: 600 }}>Un produit du pack est momentanément en rupture.</p>
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "26px 0 8px" }}>
      <button type="button" className="btn btn-real-gold" style={{ height: 54 }} onClick={() => addPack(p)}>
        <PlusIcon size={18} /> Ajouter le pack · {formatPrice(p.price)}
      </button>
      <button type="button" className="btn btn-dark" style={{ height: 54 }} onClick={() => { addPack(p); router.push("/panier") }}>
        Acheter maintenant
      </button>
    </div>
  )
}
