"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import type { SitePack } from "@/lib/types"
import { formatPrice } from "@/lib/site"
import { useCart } from "./CartProvider"
import { CheckIcon, PlusIcon } from "./icons"
import { SiteBadge } from "./SiteBadge"
import styles from "./PackCard.module.css"

// A pack: its photo, or a mosaic of its products' photos, a real-gold saving badge, the products inside,
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
  const photos = p.items.filter((i) => i.image).slice(0, 4)
  const count = p.items.reduce((n, i) => n + i.quantity, 0)

  return (
    <article className={`${styles.card} ${!p.inStock ? styles.out : ""}`}>
      <Link href={`/packs/${p.slug}`} className={styles.media} aria-label={p.name}>
        {p.image ? (
          <Image src={p.image} alt={p.name} fill sizes="(max-width: 700px) 100vw, 400px" className={styles.cover} />
        ) : photos.length ? (
          <span className={styles.mosaic} data-n={photos.length}>
            {photos.map((i) => (
              <span key={i.id} className={styles.tile}><Image src={i.image!} alt="" fill sizes="200px" /></span>
            ))}
          </span>
        ) : (
          <span className={styles.empty}><span className="script text-gold">Pack</span><strong>{count} soins</strong></span>
        )}
        {pct > 0 && <span className={styles.saving}>-{pct} %<small>{formatPrice(p.saving)} d&apos;économie</small></span>}
        <span className={styles.count}>{count} articles</span>
        <SiteBadge label={p.badge} className={styles.badge} />
      </Link>

      <div className={styles.body}>
        <span className={`script text-gold ${styles.kicker}`}>Le pack</span>
        <h3><Link href={`/packs/${p.slug}`}>{p.name}</Link></h3>
        <ul className={styles.items}>
          {p.items.slice(0, 4).map((i) => (
            <li key={i.id}><span>{i.quantity > 1 ? `${i.quantity} ×` : "•"}</span> {i.name}</li>
          ))}
          {p.items.length > 4 && <li className={styles.moreItems}>+ {p.items.length - 4} autre{p.items.length - 4 > 1 ? "s" : ""}</li>}
        </ul>

        <div className={styles.footer}>
          <p className={styles.price}>
            <strong>{formatPrice(p.price)}</strong>
            {p.saving > 0 && <s>{formatPrice(p.value)}</s>}
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
