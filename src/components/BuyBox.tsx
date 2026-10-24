"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { CardProduct } from "@/lib/types"
import { formatPrice, SITE, whatsappLink } from "@/lib/site"
import { useCart } from "./CartProvider"
import { MinusIcon, PlusIcon } from "./icons"
import styles from "./BuyBox.module.css"

export function BuyBox({ product: p }: { product: CardProduct }) {
  const { add } = useCart()
  const router = useRouter()
  const [qty, setQty] = useState(1)

  if (!p.inStock) {
    return (
      <div className={styles.box}>
        <p className={styles.out}>Momentanément en rupture de stock</p>
        {SITE.whatsapp && (
          <a className="btn btn-light" href={whatsappLink(`Bonjour Hari Store, le produit « ${p.name} » sera-t-il bientôt disponible ?`)} target="_blank" rel="noopener">
            Être prévenu(e) sur WhatsApp
          </a>
        )}
      </div>
    )
  }

  return (
    <div className={styles.box}>
      <div className={styles.row}>
        <div className={styles.qty} aria-label="Quantité">
          <button type="button" onClick={() => setQty((n) => Math.max(1, n - 1))} aria-label="Retirer un"><MinusIcon size={16} /></button>
          <span>{qty}</span>
          <button type="button" onClick={() => setQty((n) => Math.min(99, n + 1))} aria-label="Ajouter un"><PlusIcon size={16} /></button>
        </div>
        <button type="button" className={`btn btn-dark ${styles.add}`} onClick={() => add(p, qty)}>
          Ajouter au panier · {formatPrice(p.price * qty)}
        </button>
      </div>
      {/* straight to the cart, to place the order */}
      <button type="button" className={`btn btn-real-gold ${styles.direct}`} onClick={() => { add(p, qty); router.push("/panier") }}>
        Acheter maintenant
      </button>
    </div>
  )
}
