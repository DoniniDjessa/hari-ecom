"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { CardProduct } from "@/lib/types"
import { discount } from "@/lib/types"
import { whatsappLink } from "@/lib/site"
import { useCart } from "./CartProvider"
import { ProductVisual } from "./ProductVisual"
import { Stars } from "./Stars"
import { CheckIcon, PlusIcon, ShareIcon } from "./icons"
import { SiteBadge } from "./SiteBadge"
import { FavButton } from "./FavButton"
import styles from "./ShowcaseCard.module.css"
import { Euro } from "@/components/Euro"
import { Price } from "@/components/Price"

// Showcase card (home › Meilleures ventes): a white rounded card, the product photo large, a gold pill
// astride the right edge (favourite + share), then brand, name, price and the stars out of 5 (the rating set
// in the web app: Produits › Modifier › Note affichée), and a black "Ajouter au panier" pill astride the
// bottom edge. The other product lists keep ProductCard.
export function ShowcaseCard({ product: p, n = 0 }: { product: CardProduct; n?: number }) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), 1600)
    return () => clearTimeout(t)
  }, [added])

  // the phone's share sheet, else WhatsApp
  const share = async () => {
    const url = `${window.location.origin}/produit/${p.slug}`
    if (navigator.share) {
      try { await navigator.share({ title: p.name, url }) } catch {}
      return
    }
    window.open(whatsappLink(`${p.name} chez Hari Store : ${url}`), "_blank", "noopener")
  }

  const off = discount(p)
  return (
    <article className={`${styles.card} ${!p.inStock ? styles.out : ""}`} style={{ ["--n" as string]: n % 8 }}>
      <Link href={`/produit/${p.slug}`} className={styles.media} aria-label={p.name}>
        <ProductVisual src={p.image} alt={p.name} brand={p.brand} sizes="(max-width: 600px) 50vw, (max-width: 1100px) 33vw, 300px" />
      </Link>

      {(off > 0 || p.badge) && (
        <div className={styles.badges}>
          {off > 0 && <span className={styles.promo}>-{off} %</span>}
          <SiteBadge label={p.badge} />
        </div>
      )}

      {/* favourite + share, astride the right edge */}
      <div className={styles.side}>
        <FavButton product={p} className={styles.sideBtn} />
        <button type="button" className={styles.sideBtn} onClick={share} aria-label={`Partager ${p.name}`} title="Partager">
          <ShareIcon size={18} />
        </button>
      </div>

      <div className={styles.body}>
        {p.brand && <span className={styles.brand}>{p.brand}</span>}
        <h3 className={styles.name}><Link href={`/produit/${p.slug}`}>{p.name}</Link></h3>
        <p className={styles.price}>
          <Price amount={p.price} />
          {p.oldPrice && <s><Price amount={p.oldPrice} /></s>}
          <Euro amount={p.price} />
        </p>
        {p.rating != null && <span className={styles.stars}><Stars rating={p.rating} reviews={p.reviews} size={15} /></span>}
      </div>

      {/* astride the bottom edge */}
      <button
        type="button"
        className={`${styles.add} ${added ? styles.done : ""}`}
        onClick={() => { add(p); setAdded(true) }}
        disabled={!p.inStock}
      >
        {!p.inStock ? "Rupture de stock" : added ? <><CheckIcon size={17} /> Ajouté</> : <><PlusIcon size={17} /> Ajouter au panier</>}
      </button>
    </article>
  )
}
