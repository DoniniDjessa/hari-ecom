"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { CardProduct } from "@/lib/types"
import { formatPrice } from "@/lib/site"
import { useCart } from "./CartProvider"
import { ProductVisual } from "./ProductVisual"
import { Stars } from "./Stars"
import { ArrowIcon, CheckIcon, PlusIcon } from "./icons"
import styles from "./ProductCard.module.css"

// Card: the photo on its studio background (soft halo, badges stacked on the left). On hover the photo
// rises a little, a gold line draws itself on top and an "Ajouter au panier" bar slides up from the
// bottom of the photo (phones: a round "+" always there). Adding shows "Ajouté" for a moment.
// Below: brand · form, name, rating, price and the best "n for x" offer. `n` staggers the entrance.
// `favourites`: in the "Nos coups de cœur" row, the own badge (else "Coup de cœur"), never "Nouveau".
export function ProductCard({ product: p, priority, n = 0, favourites }: { product: CardProduct; priority?: boolean; n?: number; favourites?: boolean }) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), 1600)
    return () => clearTimeout(t)
  }, [added])

  const onAdd = () => {
    add(p)
    setAdded(true)
  }

  const badges = (favourites
    ? [{ label: p.badge || "Coup de cœur", gold: true }, p.bestseller && { label: "Meilleure vente", gold: false }]
    : [
        p.badge && { label: p.badge, gold: true },
        p.bestseller && { label: "Meilleure vente", gold: !p.badge },
        !p.badge && p.featured && { label: "Coup de cœur", gold: false },
        p.isNew && { label: "Nouveau", gold: false },
      ]).filter(Boolean).slice(0, 2) as { label: string; gold: boolean }[]
  const meta = [p.brand, p.form, p.volume].filter(Boolean)

  return (
    <article className={`${styles.card} ${!p.inStock ? styles.out : ""}`} style={{ ["--n" as string]: n % 8 }}>
      <div className={styles.media}>
        <Link href={`/produit/${p.slug}`} className={styles.photo} aria-label={p.name}>
          <ProductVisual src={p.image} alt={p.name} brand={p.brand} sizes="(max-width: 600px) 50vw, (max-width: 1100px) 33vw, 300px" priority={priority} />
        </Link>

        {p.inStock ? (
          badges.length > 0 && (
            <div className={styles.badges}>
              {badges.map((b) => <span key={b.label} className={b.gold ? styles.badgeGold : ""}>{b.label}</span>)}
            </div>
          )
        ) : (
          <span className={styles.soldOut}>Rupture de stock</span>
        )}

        {p.inStock && (
          <>
            <button type="button" className={`${styles.addBar} ${added ? styles.done : ""}`} onClick={onAdd}>
              {added ? <><CheckIcon size={17} /> Ajouté au panier</> : <><PlusIcon size={17} /> Ajouter au panier</>}
            </button>
            <button type="button" className={`${styles.addRound} ${added ? styles.done : ""}`} onClick={onAdd} aria-label={`Ajouter ${p.name} au panier`}>
              {added ? <CheckIcon size={18} /> : <PlusIcon size={18} />}
            </button>
          </>
        )}
      </div>

      <div className={styles.body}>
        {meta.length > 0 && (
          <p className={styles.meta}>
            {p.brand && <strong>{p.brand}</strong>}
            {meta.slice(p.brand ? 1 : 0).map((m) => <span key={m}>{m}</span>)}
          </p>
        )}
        <h3 className={styles.name}><Link href={`/produit/${p.slug}`}>{p.name}</Link></h3>
        {p.rating != null && <Stars rating={p.rating} reviews={p.reviews} />}
        <div className={styles.priceRow}>
          <div>
            <strong className={styles.price}>{formatPrice(p.price)}</strong>
            {p.lot && <span className={styles.lot}>{p.lot.quantity} pour {formatPrice(p.lot.price)}</span>}
          </div>
          <Link href={`/produit/${p.slug}`} className={styles.view} aria-label={`Voir ${p.name}`}>
            <ArrowIcon size={16} />
          </Link>
        </div>
      </div>
    </article>
  )
}
