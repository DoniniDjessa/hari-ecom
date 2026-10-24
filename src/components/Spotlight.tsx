"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import type { CardProduct } from "@/lib/types"
import { formatPrice } from "@/lib/site"
import { useCart } from "./CartProvider"
import { ProductVisual } from "./ProductVisual"
import { ArrowIcon, CheckIcon, PlusIcon } from "./icons"
import styles from "./Spotlight.module.css"

export type SpotlightProduct = CardProduct & { pitch: string }

// "Meilleures sélections pour vous", right under the hero: the products ticked in the web app (3 at most),
// a black and gold showcase, unlike the other cards.
// A halo of light follows the pointer over each card, the product floats over its reflection and tilts
// toward the pointer. Phones: one swipeable row.
export function Spotlight({ products }: { products: SpotlightProduct[] }) {
  if (!products.length) return null
  return (
    <section className={`${styles.section} reveal`} data-station="Sélections">
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.head}>
        <span className="script text-gold">Choisis par nos conseillères</span>
        <h2>Meilleures sélections pour vous.</h2>
      </div>
      <div className={`${styles.row} stagger`}>
        {products.map((p, i) => <Card key={p.id} p={p} i={i} />)}
      </div>
    </section>
  )
}

function Card({ p, i }: { p: SpotlightProduct; i: number }) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)
  useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), 1600)
    return () => clearTimeout(t)
  }, [added])

  const move = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return
    const box = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - box.left) / box.width
    const y = (e.clientY - box.top) / box.height
    e.currentTarget.style.setProperty("--x", `${x * 100}%`)
    e.currentTarget.style.setProperty("--y", `${y * 100}%`)
    e.currentTarget.style.setProperty("--rx", `${(0.5 - y) * 10}deg`)
    e.currentTarget.style.setProperty("--ry", `${(x - 0.5) * 14}deg`)
  }
  const leave = (e: React.PointerEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty("--rx", "0deg")
    e.currentTarget.style.setProperty("--ry", "0deg")
  }

  return (
    <article className={styles.card} onPointerMove={move} onPointerLeave={leave}>
      <span className={styles.light} aria-hidden="true" />
      <span className={styles.num} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
      {p.badge && <span className={styles.badge}>{p.badge}</span>}

      <Link href={`/produit/${p.slug}`} className={styles.stage} aria-label={p.name}>
        <span className={styles.pedestal} aria-hidden="true" />
        <span className={styles.product}>
          <ProductVisual src={p.image} alt={p.name} brand={p.brand} sizes="(max-width: 900px) 80vw, 380px" />
        </span>
      </Link>

      <div className={styles.body}>
        {p.brand && <span className={`script text-gold ${styles.brand}`}>{p.brand}</span>}
        <h3><Link href={`/produit/${p.slug}`}>{p.name}</Link></h3>
        {p.pitch && <p className={styles.pitch}>{p.pitch}</p>}
        <div className={styles.foot}>
          <strong className={styles.price}>{formatPrice(p.price)}</strong>
          <div className={styles.actions}>
            <Link href={`/produit/${p.slug}`} className={styles.more}>Découvrir <ArrowIcon size={15} /></Link>
            {p.inStock && (
              <button type="button" className={`${styles.add} ${added ? styles.added : ""}`} onClick={() => { add(p); setAdded(true) }} aria-label={`Ajouter ${p.name} au panier`}>
                {added ? <CheckIcon size={17} /> : <PlusIcon size={17} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
