"use client"

import { useState } from "react"
import Link from "next/link"
import type { SitePack } from "@/lib/types"
import { AddPackButton } from "./AddPackButton"
import { SiteBadge } from "./SiteBadge"
import { PackVisual } from "./PackVisual"
import { ProductVisual } from "./ProductVisual"
import { PackSaving } from "./PackSaving"
import { PackDetails } from "./PackDetails"
import styles from "./PackCard.module.css"
import { Euro } from "@/components/Euro"
import { Price } from "@/components/Price"

// A pack: its photo (PackVisual), a real-gold saving badge, the products inside in small frames (a click
// shows that product big in place of the photo, the first frame brings the pack's photo back), the price
// against what the products cost one by one, "Détails" (a modal with everything) and "Ajouter le pack".
// `list`: also the list of the products' names (the packs page); the home page keeps the card light.
export function PackCard({ pack: p, list = true }: { pack: SitePack; list?: boolean }) {
  // the product shown big instead of the pack's photo (null: the pack's photo)
  const [shown, setShown] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const pct = p.value > 0 && p.saving > 0 ? Math.round((p.saving / p.value) * 100) : 0
  const count = p.items.reduce((n, i) => n + i.quantity, 0)
  const item = p.items.find((i) => i.id === shown)

  return (
    <article className={`${styles.card} ${!p.inStock ? styles.out : ""}`}>
      <Link href={`/packs/${p.slug}`} className={styles.media} aria-label={p.name} data-pack-photo>
        {item ? (
          <span key={item.id} className={styles.shown}>
            <ProductVisual src={item.image} alt={item.name} brand={item.brand} sizes="(max-width: 700px) 100vw, 400px" />
          </span>
        ) : (
          <span key="pack" className={styles.shownPack}>
            <PackVisual pack={p} sizes="(max-width: 700px) 100vw, 400px" />
          </span>
        )}
        {pct > 0 && <span className={styles.saving}>-{pct} %<small><Price amount={p.saving} /> d&apos;économie</small></span>}
        <span className={styles.count}>{count} articles</span>
        {item ? <span className={styles.shownName}>{item.quantity > 1 ? `${item.quantity} × ` : ""}{item.name}</span> : <SiteBadge label={p.badge} className={styles.badge} />}
      </Link>

      <div className={styles.body}>
        {/* the pack's photo then its products in small frames: a click shows it big above */}
        <ul className={styles.minis} aria-label="Photos du pack">
          <li>
            <button type="button" className={`${styles.mini} ${!item ? styles.miniOn : ""}`} title="Le pack" aria-label="Photo du pack"
              aria-pressed={!item} onClick={() => setShown(null)}>
              <PackVisual pack={p} sizes="56px" />
            </button>
          </li>
          {p.items.slice(0, 4).map((i) => (
            <li key={i.id}>
              <button type="button" className={`${styles.mini} ${shown === i.id ? styles.miniOn : ""}`} title={i.name} aria-label={i.name}
                aria-pressed={shown === i.id} onClick={() => setShown(i.id)}>
                <ProductVisual src={i.image} alt="" brand={i.brand} sizes="56px" />
                {i.quantity > 1 && <span className={styles.miniQty}>×{i.quantity}</span>}
              </button>
            </li>
          ))}
          {p.items.length > 4 && (
            <li>
              <button type="button" className={styles.miniMore} onClick={() => setOpen(true)} aria-label="Voir tous les produits du pack">
                +{p.items.length - 4}
              </button>
            </li>
          )}
        </ul>
        <span className={`script text-gold ${styles.kicker}`}>Le pack</span>
        <h3><Link href={`/packs/${p.slug}`}>{p.name}</Link></h3>
        {list ? (
          <ul className={styles.items}>
            {p.items.slice(0, 4).map((i) => (
              <li key={i.id}><span>{i.quantity > 1 ? `${i.quantity} ×` : "•"}</span> {i.name}</li>
            ))}
            {p.items.length > 4 && <li className={styles.moreItems}>+ {p.items.length - 4} autre{p.items.length - 4 > 1 ? "s" : ""}</li>}
          </ul>
        ) : <div className={styles.gap} />}

        {/* separately vs the pack, the value bar, what the client saves */}
        <PackSaving value={p.value} price={p.price} />

        <div className={styles.footer}>
          <p className={styles.price}>
            <strong><Price amount={p.price} /></strong>
            <Euro amount={p.price} />
          </p>
          <div className={styles.actions}>
            <button type="button" className={`btn ${styles.details}`} onClick={() => setOpen(true)}>Détails</button>
            <AddPackButton pack={p} className={styles.add} />
          </div>
        </div>
      </div>

      {open && <PackDetails pack={p} onClose={() => setOpen(false)} />}
    </article>
  )
}
