"use client"

import { useEffect, useRef, useState, type SyntheticEvent } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import type { SitePack } from "@/lib/types"
import { ArrowIcon, CloseIcon } from "./icons"
import { SiteBadge } from "./SiteBadge"
import { PackVisual } from "./PackVisual"
import { ProductVisual } from "./ProductVisual"
import { PackSaving } from "./PackSaving"
import { AddPackButton } from "./AddPackButton"
import styles from "./PackDetails.module.css"
import { Euro } from "@/components/Euro"
import { Price } from "@/components/Price"

// Everything about a pack, in a modal over the page: its photo, description, every product (photo,
// quantity, price, link), the saving, the price and "Ajouter le pack". Esc, the backdrop or × close it.
// Rendered in <body> (a portal): the ring's turned slides would otherwise hold it inside them.
export function PackDetails({ pack: p, onClose }: { pack: SitePack; onClose: () => void }) {
  const [mounted, setMounted] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose })

  useEffect(() => {
    setMounted(true)
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close.current() }
    document.addEventListener("keydown", onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const back = document.activeElement as HTMLElement | null
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = overflow
      back?.focus?.()
    }
  }, [])
  useEffect(() => { if (mounted) closeRef.current?.focus() }, [mounted])

  if (!mounted) return null
  const count = p.items.reduce((n, i) => n + i.quantity, 0)
  // React events go up through the portal to the card and the ring (swipes, clicks): they stop here
  const stop = (e: SyntheticEvent) => e.stopPropagation()

  return createPortal(
    <div className={styles.backdrop} onClick={(e) => { stop(e); if (e.target === e.currentTarget) onClose() }}
      onTouchStart={stop} onTouchEnd={stop} onMouseEnter={stop}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby={`pack-${p.id}`}>
        <button ref={closeRef} type="button" className={styles.close} aria-label="Fermer" onClick={onClose}><CloseIcon size={20} /></button>

        <div className={styles.media}>
          <PackVisual pack={p} sizes="(max-width: 760px) 100vw, 380px" />
          <SiteBadge label={p.badge} className={styles.badge} />
        </div>

        <div className={styles.body}>
          <span className={`script text-gold ${styles.kicker}`}>Le pack</span>
          <h2 id={`pack-${p.id}`}>{p.name}</h2>
          {p.description && <p className={styles.desc}>{p.description}</p>}

          <h3 className={styles.listTitle}>{count} article{count > 1 ? "s" : ""} dans le pack</h3>
          <ul className={styles.items}>
            {p.items.map((i) => (
              <li key={i.id}>
                <Link href={`/produit/${i.slug}`} className={styles.item} onClick={onClose}>
                  <span className={styles.thumb}><ProductVisual src={i.image} alt="" brand={i.brand} sizes="64px" /></span>
                  <span className={styles.itemText}>
                    {i.brand && <small>{i.brand}</small>}
                    <strong>{i.name}</strong>
                    {!i.inStock && <em>Rupture de stock</em>}
                  </span>
                  <span className={styles.itemPrice}>
                    {i.quantity > 1 && <span className={styles.qty}>{i.quantity} ×</span>}
                    <Price amount={i.price} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <PackSaving value={p.value} price={p.price} />

          <div className={styles.footer}>
            <p className={styles.price}>
              <strong><Price amount={p.price} /></strong>
              <Euro amount={p.price} />
            </p>
            <AddPackButton pack={p} className={styles.add} />
          </div>
          <Link href={`/packs/${p.slug}`} className={`link-more ${styles.more}`} onClick={onClose}>
            Voir la page du pack <ArrowIcon size={16} />
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  )
}
