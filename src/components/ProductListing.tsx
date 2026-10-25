import Link from "next/link"
import type { CardProduct } from "@/lib/types"
import { ProductCard } from "./ProductCard"
import styles from "./ProductListing.module.css"

// A landing page of products (a brand, a need): crumbs, a handwritten eyebrow, the title, an intro written
// for search engines and readers, the products, then links to the neighbouring pages.
export function ProductListing({ crumbs, eyebrow, title, intro, products, more, empty = "Aucun produit pour l'instant." }: {
  crumbs: { name: string; href?: string }[]
  eyebrow: string
  title: string
  intro: string
  products: CardProduct[]
  /** other pages to visit (other needs, brands) */
  more?: { title: string; links: { href: string; label: string }[] }
  empty?: string
}) {
  return (
    <div className={`container ${styles.page}`}>
      <nav className={styles.crumbs} aria-label="Fil d'Ariane">
        {crumbs.map((c, i) => (
          <span key={c.name}>
            {i > 0 && <i>/</i>}
            {c.href ? <Link href={c.href}>{c.name}</Link> : <span>{c.name}</span>}
          </span>
        ))}
      </nav>
      <header className={`${styles.head} reveal`}>
        <span className="script text-gold">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{intro}</p>
        <small>{products.length} produit{products.length > 1 ? "s" : ""}</small>
      </header>
      {products.length ? (
        <div className={`${styles.grid} stagger`}>
          {products.map((p, i) => <ProductCard key={p.id} product={p} n={i} priority={i < 4} />)}
        </div>
      ) : (
        <p className={styles.empty}>{empty}</p>
      )}
      {more && more.links.length > 0 && (
        <section className={styles.more}>
          <h2>{more.title}</h2>
          <div>{more.links.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}</div>
        </section>
      )}
    </div>
  )
}
