"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { SitePack } from "@/lib/types"
import { useCart } from "./CartProvider"
import { CheckIcon, PlusIcon } from "./icons"
import { SiteBadge } from "./SiteBadge"
import { PackVisual } from "./PackVisual"
import { ProductVisual } from "./ProductVisual"
import { PackSaving } from "./PackSaving"
import styles from "./PackCard.module.css"
import { Euro } from "@/components/Euro"
import { Price } from "@/components/Price"

// A pack: its photo (PackVisual), a real-gold saving badge, the products inside,
// the price against what the products cost one by one, and "Ajouter le pack" (one line in the cart).
export function PackCard({ pack: p }: { pack: SitePack }) {
  const { addPack } = useCart()
  const [added, setAdded] = useState(false)
  useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), 1600)
    return () => clearTimeout(t)
  }, [added])

  const pct = p.value > 0 && p.saving > 0 ? Math.round((p.saving / p.value) * 100) : 0
  const count = p.items.reduce((n, i) => n + i.quantity, 0)

  return (
    <article className={`${styles.card} ${!p.inStock ? styles.out : ""}`}>
      <Link href={`/packs/${p.slug}`} className={styles.media} aria-label={p.name}>
        <PackVisual pack={p} sizes="(max-width: 700px) 100vw, 400px" />
        {pct > 0 && <span className={styles.saving}>-{pct} %<small><Price amount={p.saving} /> d&apos;économie</small></span>}
        <span className={styles.count}>{count} articles</span>
        <SiteBadge label={p.badge} className={styles.badge} />
      </Link>

      <div className={styles.body}>
        {/* the products of the pack in small frames, under the pack's photo */}
        <ul className={styles.minis} aria-label="Produits du pack">
          {p.items.slice(0, 5).map((i) => (
            <li key={i.id}>
              <Link href={`/produit/${i.slug}`} className={styles.mini} title={i.name} aria-label={i.name}>
                <ProductVisual src={i.image} alt="" brand={i.brand} sizes="56px" />
                {i.quantity > 1 && <span className={styles.miniQty}>×{i.quantity}</span>}
              </Link>
            </li>
          ))}
          {p.items.length > 5 && <li className={styles.miniMore}>+{p.items.length - 5}</li>}
        </ul>
        <span className={`script text-gold ${styles.kicker}`}>Le pack</span>
        <h3><Link href={`/packs/${p.slug}`}>{p.name}</Link></h3>
        <ul className={styles.items}>
          {p.items.slice(0, 4).map((i) => (
            <li key={i.id}><span>{i.quantity > 1 ? `${i.quantity} ×` : "•"}</span> {i.name}</li>
          ))}
          {p.items.length > 4 && <li className={styles.moreItems}>+ {p.items.length - 4} autre{p.items.length - 4 > 1 ? "s" : ""}</li>}
        </ul>

        {/* separately vs the pack, the value bar, what the client saves */}
        <PackSaving value={p.value} price={p.price} />

        <div className={styles.footer}>
          <p className={styles.price}>
            <strong><Price amount={p.price} /></strong>
            <Euro amount={p.price} />
          </p>
          <button
            type="button"
            className={`btn ${added ? "btn-dark" : "btn-real-gold"} ${styles.add}`}
            onClick={() => { addPack(p); setAdded(true) }}
            disabled={!p.inStock}
          >
            {!p.inStock ? "Indisponible" : added ? <><CheckIcon size={16} /> Ajouté</> : <><PlusIcon size={16} /> Ajouter le pack</>}
          </button>
        </div>
      </div>
    </article>
  )
}
