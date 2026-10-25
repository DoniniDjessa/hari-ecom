import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getProduct, getProducts, related } from "@/lib/catalog"
import { formatPrice, UNIVERSES } from "@/lib/site"
import { toCard } from "@/lib/types"
import { ProductVisual } from "@/components/ProductVisual"
import { ProductCard } from "@/components/ProductCard"
import { BuyBox } from "@/components/BuyBox"
import { Stars } from "@/components/Stars"
import { ChatIcon, ShieldIcon, TruckIcon } from "@/components/icons"
import { SiteBadge } from "@/components/SiteBadge"
import styles from "./product.module.css"

export const revalidate = 300

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await getProduct((await params).slug)
  if (!p) return { title: "Produit introuvable" }
  return {
    title: p.name,
    description: p.pitch || p.description || `${p.name} — ${p.brand}, disponible chez Hari Store.`,
    openGraph: p.image ? { images: [{ url: p.image }] } : undefined,
  }
}

export default async function ProductPage({ params }: { params: Params }) {
  const p = await getProduct((await params).slug)
  if (!p) notFound()
  const universe = UNIVERSES.find((u) => u.name === p.universe)
  const others = related(await getProducts(), p).map(toCard)
  // the pitch is the lead under the price; the long description opens the details below
  const about = p.pitch || p.description
  const description = p.pitch && p.description && p.description !== p.pitch ? p.description : ""

  const details = [
    { title: "Description", show: !!description, body: <p>{description}</p> },
    { title: "Bienfaits", show: p.benefits.length > 0, body: <ul className={styles.tags}>{p.benefits.map((b) => <li key={b}>{b}</li>)}</ul> },
    {
      title: "Conseils d'utilisation",
      show: !!p.usage || p.moments.length > 0,
      body: (
        <>
          {p.usage && <p>{p.usage}</p>}
          {p.moments.length > 0 && <ul className={styles.tags}>{p.moments.map((m) => <li key={m}>{m}</li>)}</ul>}
        </>
      ),
    },
    { title: "Ingrédients clés", show: p.keyIngredients.length > 0, body: <ul className={styles.tags}>{p.keyIngredients.map((b) => <li key={b}>{b}</li>)}</ul> },
    {
      title: "Pour qui ?",
      show: p.skinTypes.length + p.hairTypes.length + p.targets.length > 0,
      body: (
        <dl className={styles.facts}>
          {p.targets.length > 0 && <><dt>Pour</dt><dd>{p.targets.join(", ")}</dd></>}
          {p.skinTypes.length > 0 && <><dt>Peau</dt><dd>{p.skinTypes.join(", ")}</dd></>}
          {p.hairTypes.length > 0 && <><dt>Cheveux</dt><dd>{p.hairTypes.join(", ")}</dd></>}
        </dl>
      ),
    },
    {
      title: "Précautions",
      show: !!p.precautions || p.alertIngredients.length > 0,
      body: (
        <>
          {p.precautions && <p>{p.precautions}</p>}
          {p.alertIngredients.length > 0 && <p><strong>Contient :</strong> {p.alertIngredients.join(", ")}</p>}
        </>
      ),
    },
  ].filter((d) => d.show)

  return (
    <>
      <div className="container">
        <nav className={styles.crumbs} aria-label="Fil d'Ariane">
          <Link href="/">Accueil</Link>
          <span>/</span>
          <Link href="/boutique">Boutique</Link>
          {universe && (
            <>
              <span>/</span>
              <Link href={`/boutique?univers=${universe.slug}`}>{universe.name}</Link>
            </>
          )}
        </nav>

        <div className={styles.layout}>
          <div className={styles.gallery}>
            <div className={styles.photo}>
              <ProductVisual src={p.image} alt={p.name} brand={p.brand} sizes="(max-width: 900px) 100vw, 620px" priority />
              <SiteBadge label={p.badge} className={styles.badge} />
            </div>
          </div>

          <div className={styles.info}>
            {p.brand && <span className={styles.brand}>{p.brand}</span>}
            <h1>{p.name}</h1>
            <div className={styles.meta}>
              {p.rating != null && <Stars rating={p.rating} reviews={p.reviews} size={15} />}
              {[p.range && `Gamme ${p.range}`, p.form, p.volume].filter(Boolean).length > 0 && (
                <span>{[p.range && `Gamme ${p.range}`, p.form, p.volume].filter(Boolean).join(" · ")}</span>
              )}
            </div>

            <p className={styles.price}>{formatPrice(p.price)}</p>
            {p.lots.length > 0 && (
              <ul className={styles.lots}>
                {p.lots.map((l) => (
                  <li key={l.quantity}>
                    <strong>{l.quantity} pour {formatPrice(l.price)}</strong>
                    <span>soit {formatPrice(l.price / l.quantity)} l&apos;unité</span>
                  </li>
                ))}
              </ul>
            )}

            {about && <p className={styles.about}>{about}</p>}

            <BuyBox product={toCard(p)} />

            <ul className={styles.promises}>
              <li><TruckIcon size={20} /> Livraison à Abidjan, paiement à la livraison</li>
              <li><ShieldIcon size={20} /> Produit authentique, contrôlé en boutique</li>
              <li><ChatIcon size={20} /> Un doute ? Nos conseillères vous répondent sur WhatsApp</li>
            </ul>

            {details.length > 0 && (
              <div className={styles.details}>
                {details.map((d, i) => (
                  <details key={d.title} open={i === 0}>
                    <summary>{d.title}</summary>
                    <div className={styles.detailBody}>{d.body}</div>
                  </details>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {others.length > 0 && (
        <section className="section reveal">
          <div className="container">
            <div className="section-head">
              <div>
                <h2 className="section-title">Vous aimerez aussi.</h2>
                <p>D&apos;autres soins {p.universe ? p.universe.toLowerCase() : ""} choisis par nos conseillères.</p>
              </div>
            </div>
            <div className={`${styles.related} stagger`}>
              {others.map((o) => <ProductCard key={o.id} product={o} />)}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
