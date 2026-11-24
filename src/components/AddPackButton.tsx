"use client"

import { useEffect, useState } from "react"
import type { SitePack } from "@/lib/types"
import { useCart } from "./CartProvider"
import { CheckIcon, PlusIcon } from "./icons"

/** "Ajouter le pack" with its short "Ajouté" feedback (the card and the details modal) */
export function AddPackButton({ pack: p, className }: { pack: SitePack; className?: string }) {
  const { addPack } = useCart()
  const [added, setAdded] = useState(false)
  useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), 1600)
    return () => clearTimeout(t)
  }, [added])
  return (
    <button
      type="button"
      className={`btn ${added ? "btn-dark" : "btn-real-gold"} ${className ?? ""}`}
      onClick={() => { addPack(p); setAdded(true) }}
      disabled={!p.inStock}
    >
      {!p.inStock ? "Indisponible" : added ? <><CheckIcon size={16} /> Ajouté</> : <><PlusIcon size={16} /> Ajouter le pack</>}
    </button>
  )
}
