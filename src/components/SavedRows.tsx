"use client"

import Link from "next/link"
import { useMemo } from "react"
import type { CardProduct } from "@/lib/types"
import { ProductCard } from "./ProductCard"
import { useCatalog, useFavourites, useRecent } from "./Saved"
import { ArrowIcon } from "./icons"
import styles from "./SavedRows.module.css"

const pick = (catalog: CardProduct[] | null, ids: string[]) => {
  if (!catalog) return []
  const byId = new Map(catalog.map((p) => [p.id, p]))
  return ids.map((id) => byId.get(id)).filter((p): p is CardProduct => !!p)
}

/** "Vu récemment": the last products opened, except the one on screen; nothing when empty */
export function RecentlyViewed({ exclude, title = "Vu récemment." }: { exclude?: string; title?: string }) {
  const { ready, recent } = useRecent()
  const ids = useMemo(() => recent.filter((id) => id !== exclude).slice(0, 8), [recent, exclude])
  const catalog = useCatalog(ready && ids.length > 0)
  const products = pick(catalog, ids)
  if (!products.length) return null
  return (
    <section className={`section ${styles.row}`}>
      <div className="container">
        <div className="section-head">
          <div>
            <span className="script text-gold">Vous les avez regardés</span>
            <h2 className="section-title">{title}</h2>
          </div>
        </div>
        <div className={styles.scroller}>
          {products.map((p, i) => <ProductCard key={p.id} product={p} n={i} />)}
        </div>
      </div>
    </section>
  )
}

/** The page "Mes favoris" */
export function FavouritesList() {
  const { ready, favourites } = useFavourites()
  const catalog = useCatalog(ready && favourites.length > 0)
  const products = pick(catalog, favourites)
  if (!ready || (favourites.length > 0 && !catalog)) return <p className={styles.note}>Chargement…</p>
  if (!products.length) {
    return (
      <div className={styles.empty}>
        <p>Vous n&apos;avez pas encore de favoris. Touchez le cœur d&apos;un produit pour le retrouver ici.</p>
        <Link href="/boutique" className="btn btn-dark">Découvrir la boutique <ArrowIcon size={18} /></Link>
      </div>
    )
  }
  return (
    <>
      <p className={styles.count}>{products.length} produit{products.length > 1 ? "s" : ""} gardé{products.length > 1 ? "s" : ""} sur cet appareil</p>
      <div className={styles.grid}>
        {products.map((p, i) => <ProductCard key={p.id} product={p} n={i} />)}
      </div>
    </>
  )
}
