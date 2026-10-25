import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getProduct, getProducts, related, slugify } from "@/lib/catalog"
import { formatPrice, SITE, UNIVERSES } from "@/lib/site"
import { abs, breadcrumbLd, NEEDS } from "@/lib/seo"
import { JsonLd } from "@/components/JsonLd"
import { toCard, discount, type SiteProduct } from "@/lib/types"
import { ProductVisual } from "@/components/ProductVisual"
import { ProductCard } from "@/components/ProductCard"
import { BuyBox } from "@/components/BuyBox"
import { Stars } from "@/components/Stars"
import { ChatIcon, ShieldIcon, TruckIcon } from "@/components/icons"
import { SiteBadge } from "@/components/SiteBadge"
import { Countdown } from "@/components/Countdown"
import { FavButton } from "@/components/FavButton"
import { BoughtTogether } from "@/components/BoughtTogether"
import { RecentlyViewed } from "@/components/SavedRows"
import { TrackView } from "@/components/TrackView"
import styles from "./product.module.css"

export const revalidate = 300

type Params = Promise<{ slug: string }>

// built on the first visit, then served from the cache (refreshed every 5 min, or at once by the web app)
export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await getProduct((await params).slug)
  if (!p) return { title: "Produit introuvable", robots: { index: false } }
  const lead = p.pitch || p.description || `${p.name}, disponible chez ${SITE.fullName}.`
  const description = `${lead} ${formatPrice(p.price)}. Livraison à Abidjan, paiement à la livraison.`.slice(0, 160)
  // the JPEG version of the photo (/api/og): every messaging app shows it in the link preview
  const image = p.image ? [{ url: abs(p.image.replace("/api/img/", "/api/og/")), width: 1200, height: 1200, alt: p.name, type: "image/jpeg" }] : undefined
  return {
    title: p.brand && !p.name.toLowerCase().includes(p.brand.toLowerCase()) ? `${p.name} – ${p.brand}` : p.name,
    description,
    alternates: { canonical: `/produit/${p.slug}` },
    openGraph: { title: p.name, description, url: `/produit/${p.slug}`, images: image },
    twitter: { card: "summary_large_image", title: p.name, description, images: image?.map((i) => i.url) },
  }
}

/** schema.org Product: Google can show the price, the stock and the photo in its results */
function productLd(p: SiteProduct) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.code,
    image: p.image ? [abs(p.image)] : undefined,
    description: p.description || p.pitch || undefined,
    brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
    category: p.universe || undefined,
    offers: {
      "@type": "Offer",
      url: abs(`/produit/${p.slug}`),
      priceCurrency: "XOF",
      price: p.price,
      ...(p.promoEnds ? { priceValidUntil: p.promoEnds.slice(0, 10) } : {}),
      availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE.fullName },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "CI", addressRegion: "Abidjan" },
      },
    },
  }
}

export default async function ProductPage({ params }: { params: Params }) {
  const p = await getProduct((await params).slug)
  if (!p) notFound()
  const universe = UNIVERSES.find((u) => u.name === p.universe)
  const all = await getProducts()
  const others = related(all, p).map(toCard)
  // completes it: same range first, else same brand and universe; another form, in stock
  const together = all
    .filter((o) => o.id !== p.id && o.inStock && o.form !== p.form && o.image
      && ((p.range && o.range === p.range) || (o.brand === p.brand && o.universe === p.universe)))
    .sort((a, b) => Number(!!p.range && b.range === p.range) - Number(!!p.range && a.range === p.range))
    .slice(0, 2)
  // the pitch is the lead under the price; the long description opens the details below
  const about = p.pitch || p.description
  const description = p.pitch && p.description && p.description !== p.pitch ? p.description : ""

  const details = [
    { title: "Description", show: !!description, body: <p>{description}</p> },
    {
      title: "Bienfaits",
      show: p.benefits.length > 0,
      body: (
        <ul className={styles.tags}>
          {p.benefits.map((b) => {
            const need = NEEDS.find((n) => n.benefit === b)
            return <li key={b}>{need ? <Link href={`/besoins/${need.slug}`}>{b}</Link> : b}</li>
          })}
        </ul>
      ),
    },
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
      <JsonLd data={[
        productLd(p),
        breadcrumbLd([
          { name: "Accueil", path: "/" },
          { name: "Boutique", path: "/boutique" },
          ...(universe ? [{ name: universe.name, path: `/boutique?univers=${universe.slug}` }] : []),
          { name: p.name, path: `/produit/${p.slug}` },
        ]),
      ]} />
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
            {p.brand && <Link href={`/marques/${slugify(p.brand)}`} className={styles.brand}>{p.brand}</Link>}
            <h1>{p.name}</h1>
            <div className={styles.meta}>
              {p.rating != null && <Stars rating={p.rating} reviews={p.reviews} size={15} />}
              {[p.range && `Gamme ${p.range}`, p.form, p.volume].filter(Boolean).length > 0 && (
                <span>{[p.range && `Gamme ${p.range}`, p.form, p.volume].filter(Boolean).join(" · ")}</span>
              )}
            </div>

            <p className={styles.price}>
              {formatPrice(p.price)}
              {p.oldPrice && (
                <>
                  <s className={styles.oldPrice}>{formatPrice(p.oldPrice)}</s>
                  <span className={styles.off}>-{discount(p)} %</span>
                </>
              )}
            </p>
            {p.promoEnds && <Countdown until={p.promoEnds} className={styles.countdown} />}
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

            {p.inStock && p.stock <= 3 && <p className={styles.low}>Plus que {p.stock} en stock</p>}

            <div className={styles.buyRow}>
              <BuyBox product={toCard(p)} />
              <FavButton product={p} large className={styles.fav} />
            </div>

            <a className={styles.share} target="_blank" rel="noopener noreferrer"
              href={`https://wa.me/?text=${encodeURIComponent(`${p.name} – ${formatPrice(p.price)} chez ${SITE.fullName} : ${abs(`/produit/${p.slug}`)}`)}`}>
              <ChatIcon size={17} /> Partager sur WhatsApp
            </a>

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

        {together.length > 0 && <BoughtTogether product={toCard(p)} others={together.map(toCard)} />}
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

      <RecentlyViewed exclude={p.id} />
      <TrackView product={{ id: p.id, name: p.name, price: p.price, brand: p.brand, universe: p.universe }} />
    </>
  )
}
