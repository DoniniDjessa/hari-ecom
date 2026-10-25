"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { CardProduct } from "@/lib/types"
import { discount } from "@/lib/types"
import { formatPrice } from "@/lib/site"
import { useCart } from "./CartProvider"
import { ProductVisual } from "./ProductVisual"
import { Stars } from "./Stars"
import { ArrowIcon, CheckIcon, PlusIcon } from "./icons"
import { SiteBadge } from "./SiteBadge"
import { FavButton } from "./FavButton"
import styles from "./ProductCard.module.css"

// Card: the photo on its studio background (soft halo, badges stacked on the left). On hover the photo
// rises a little, a gold line draws itself on top and an "Ajouter au panier" bar slides up from the
// bottom of the photo (phones: a round "+" always there). Adding shows "Ajouté" for a moment.
// Below: brand · form, name, rating, price and the best "n for x" offer. `n` staggers the entrance.
// Badge: only the one chosen in the web app (the switches Nouveau, Coup de cœur… only place the product in
// a section of the home), in its colour (SiteBadge).
export function ProductCard({ product: p, priority, n = 0 }: { product: CardProduct; priority?: boolean; n?: number }) {
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

  const meta = [p.brand, p.form, p.volume].filter(Boolean)

  return (
    <article className={`${styles.card} ${!p.inStock ? styles.out : ""}`} style={{ ["--n" as string]: n % 8 }}>
      <div className={styles.media}>
        <Link href={`/produit/${p.slug}`} className={styles.photo} aria-label={p.name}>
          <ProductVisual src={p.image} alt={p.name} brand={p.brand} sizes="(max-width: 600px) 50vw, (max-width: 1100px) 33vw, 300px" priority={priority} />
        </Link>

        <FavButton product={p} className={styles.fav} />
        {p.inStock ? (
          (p.badge || discount(p) > 0) && (
            <div className={styles.badges}>
              {discount(p) > 0 && <span className={styles.promo}>-{discount(p)} %</span>}
              <SiteBadge label={p.badge} />
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
            <strong className={styles.price}>
              {formatPrice(p.price)}
              {p.oldPrice && <s className={styles.oldPrice}>{formatPrice(p.oldPrice)}</s>}
            </strong>
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
