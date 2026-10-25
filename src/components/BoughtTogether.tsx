"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import type { CardProduct } from "@/lib/types"
import { formatPrice } from "@/lib/site"
import { useCart } from "./CartProvider"
import { PlusIcon } from "./icons"
import styles from "./BoughtTogether.module.css"

/** "Souvent achetés ensemble": the product + 1 to 3 that complete it (same range, else same brand and
 *  universe, other forms). All ticked; one click adds the ticked ones to the cart. */
export function BoughtTogether({ product, others }: { product: CardProduct; others: CardProduct[] }) {
  const { add } = useCart()
  const [off, setOff] = useState<string[]>([])
  const [added, setAdded] = useState(false)
  const all = [product, ...others]
  const chosen = all.filter((p) => !off.includes(p.id))
  const total = chosen.reduce((n, p) => n + p.price, 0)

  const addAll = () => {
    chosen.forEach((p) => add(p))
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <section className={styles.box} aria-label="Souvent achetés ensemble">
      <h2>Souvent achetés ensemble</h2>
      <div className={styles.items}>
        {all.map((p, i) => (
          <div key={p.id} className={styles.item}>
            {i > 0 && <span className={styles.plus} aria-hidden="true"><PlusIcon size={14} /></span>}
            <label className={`${styles.card} ${off.includes(p.id) ? styles.off : ""}`}>
              <input
                type="checkbox"
                checked={!off.includes(p.id)}
                onChange={() => setOff((o) => (o.includes(p.id) ? o.filter((x) => x !== p.id) : [...o, p.id]))}
                aria-label={`Inclure ${p.name}`}
              />
              <span className={styles.thumb}>{p.image && <Image src={p.image} alt="" fill sizes="96px" />}</span>
              <span className={styles.name}>
                {i === 0 ? <strong>Ce produit</strong> : <Link href={`/produit/${p.slug}`}>{p.name}</Link>}
                <span>{formatPrice(p.price)}</span>
              </span>
            </label>
          </div>
        ))}
      </div>
      <div className={styles.foot}>
        <span>Total : <strong>{formatPrice(total)}</strong></span>
        <button type="button" className="btn btn-dark" onClick={addAll} disabled={!chosen.length}>
          {added ? "Ajoutés au panier" : `Ajouter les ${chosen.length} au panier`}
        </button>
      </div>
    </section>
  )
}
