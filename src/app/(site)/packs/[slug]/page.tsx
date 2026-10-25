import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { getPack } from "@/lib/packs"
import { formatPrice } from "@/lib/site"
import { PackBuy } from "@/components/PackBuy"
import { ProductVisual } from "@/components/ProductVisual"
import { ChatIcon, ShieldIcon, TruckIcon } from "@/components/icons"
import styles from "./pack.module.css"

export const revalidate = 300

type Params = Promise<{ slug: string }>

// built on the first visit, then served from the cache (refreshed every 5 min, or at once by the web app)
export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await getPack((await params).slug)
  return p ? { title: `Pack ${p.name}`, description: p.description || undefined } : { title: "Pack introuvable" }
}

export default async function PackPage({ params }: { params: Params }) {
  const p = await getPack((await params).slug)
  if (!p) notFound()
  const pct = p.value > 0 && p.saving > 0 ? Math.round((p.saving / p.value) * 100) : 0
  const photos = p.items.filter((i) => i.image).slice(0, 4)
  const count = p.items.reduce((n, i) => n + i.quantity, 0)

  return (
    <div className="container">
      <nav className={styles.crumbs} aria-label="Fil d'Ariane">
        <Link href="/">Accueil</Link><span>/</span><Link href="/packs">Nos packs</Link>
      </nav>

      <div className={styles.layout}>
        <div className={styles.gallery}>
          <div className={styles.photo}>
            {p.image ? (
              <Image src={p.image} alt={p.name} fill priority sizes="(max-width: 900px) 100vw, 620px" className={styles.cover} />
            ) : (
              <span className={styles.mosaic} data-n={photos.length || 1}>
                {(photos.length ? photos : p.items.slice(0, 1)).map((i) => (
                  <span key={i.id} className={styles.tile}>
                    <ProductVisual src={i.image} alt={i.name} brand={i.brand} sizes="300px" />
                  </span>
                ))}
              </span>
            )}
            {pct > 0 && <span className={styles.saving}>-{pct} %</span>}
          </div>
        </div>

        <div className={styles.info}>
          <span className="script text-gold">Le pack</span>
          <h1>{p.name}</h1>
          <p className={styles.meta}>{count} articles · {p.items.length} produit{p.items.length > 1 ? "s" : ""}</p>

          <div className={styles.priceBox}>
            <strong>{formatPrice(p.price)}</strong>
            {p.saving > 0 && (
              <span>
                au lieu de <s>{formatPrice(p.value)}</s>
                <em className="text-gold">soit {formatPrice(p.saving)} d&apos;économie</em>
              </span>
            )}
          </div>

          {p.description && <p className={styles.about}>{p.description}</p>}

          <PackBuy pack={p} />

          <h2 className={styles.inside}>Dans ce pack</h2>
          <ul className={styles.items}>
            {p.items.map((i) => (
              <li key={i.id}>
                <Link href={`/produit/${i.slug}`} className={styles.item}>
                  <span className={styles.thumb}><ProductVisual src={i.image} alt={i.name} sizes="80px" /></span>
                  <span className={styles.itemText}>
                    {i.brand && <small>{i.brand}</small>}
                    <strong>{i.name}</strong>
                    <span>{formatPrice(i.price)}{i.quantity > 1 ? ` × ${i.quantity}` : ""}</span>
                  </span>
                  {i.quantity > 1 && <span className={styles.qty}>× {i.quantity}</span>}
                </Link>
              </li>
            ))}
          </ul>

          <ul className={styles.promises}>
            <li><TruckIcon size={20} /> Livraison à Abidjan, paiement à la livraison</li>
            <li><ShieldIcon size={20} /> Produits authentiques, contrôlés en boutique</li>
            <li><ChatIcon size={20} /> Composé par nos conseillères</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
