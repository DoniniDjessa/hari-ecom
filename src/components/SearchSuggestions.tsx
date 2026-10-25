"use client"

import Link from "next/link"
import Image from "next/image"
import { useMemo } from "react"
import { indexProducts, searchLabels, searchProducts } from "@/lib/search"
import { NEEDS } from "@/lib/seo"
import { formatPrice } from "@/lib/site"
import { useCatalog } from "./Saved"
import { ArrowIcon } from "./icons"
import styles from "./SearchSuggestions.module.css"

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " et ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80)

/** Suggestions while typing: products (photo, price), brands and needs; typos forgiven. `onPick` closes the
 *  search. Shown under the field of the top bar and of the side menu. */
export function SearchSuggestions({ query, onPick, compact }: { query: string; onPick: () => void; compact?: boolean }) {
  const catalog = useCatalog(true)
  const index = useMemo(() => (catalog ? indexProducts(catalog) : []), [catalog])
  const brands = useMemo(() => {
    const names = [...new Set((catalog ?? []).map((p) => p.brand.trim()).filter(Boolean))]
    return names.map((name) => ({ label: name, href: `/marques/${slugify(name)}` }))
  }, [catalog])
  const needs = useMemo(() => NEEDS.map((n) => ({ label: n.title, href: `/besoins/${n.slug}` })), [])

  const q = query.trim()
  const products = useMemo(() => (q.length >= 2 ? searchProducts(index, q, compact ? 4 : 6) : []), [index, q, compact])
  const foundBrands = useMemo(() => (q.length >= 2 ? searchLabels(brands, q, 3) : []), [brands, q])
  const foundNeeds = useMemo(() => (q.length >= 3 ? searchLabels(needs, q, 3) : []), [needs, q])

  if (q.length < 2) return null
  const all = `/boutique?q=${encodeURIComponent(q)}`

  return (
    <div className={`${styles.panel} ${compact ? styles.compact : ""}`} role="listbox" aria-label="Suggestions">
      {!catalog ? (
        <p className={styles.note}>Recherche…</p>
      ) : !products.length && !foundBrands.length && !foundNeeds.length ? (
        <p className={styles.note}>Aucun résultat pour « {q} ». Essayez un autre mot, ou demandez conseil sur WhatsApp.</p>
      ) : (
        <>
          {(foundBrands.length > 0 || foundNeeds.length > 0) && (
            <div className={styles.chips}>
              {foundNeeds.map((n) => <Link key={n.href} href={n.href} onClick={onPick} className={styles.need}>{n.label}</Link>)}
              {foundBrands.map((b) => <Link key={b.href} href={b.href} onClick={onPick}>{b.label}</Link>)}
            </div>
          )}
          {products.length > 0 && (
            <ul className={styles.products}>
              {products.map((p) => (
                <li key={p.id}>
                  <Link href={`/produit/${p.slug}`} onClick={onPick} className={styles.product} role="option" aria-selected={false}>
                    <span className={styles.thumb}>
                      {p.image ? <Image src={p.image} alt="" fill sizes="56px" /> : <span>{p.brand.slice(0, 1)}</span>}
                    </span>
                    <span className={styles.info}>
                      <strong>{p.name}</strong>
                      <span>{p.brand}{p.form ? ` · ${p.form}` : ""}</span>
                    </span>
                    <span className={styles.price}>
                      {formatPrice(p.price)}
                      {p.oldPrice && <s>{formatPrice(p.oldPrice)}</s>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href={all} onClick={onPick} className={styles.all}>Voir tous les résultats <ArrowIcon size={15} /></Link>
        </>
      )}
    </div>
  )
}
