import Link from "next/link"
import Image from "next/image"
import { getProducts, getUniverseCards, withPhotosFirst } from "@/lib/catalog"
import { getSiteContent } from "@/lib/backoffice"
import { getPacks } from "@/lib/packs"
import { isSiteImage } from "@/lib/content"
import { SITE, whatsappLink } from "@/lib/site"
import { toCard, type SiteProduct } from "@/lib/types"
import { ProductCard } from "@/components/ProductCard"
import { PackCard } from "@/components/PackCard"
import { Spotlight } from "@/components/Spotlight"
import { Testimonials } from "@/components/Testimonials"
import { ShopsMap } from "@/components/ShopsMap"
import { HeroCarousel, type HeroSlide } from "@/components/HeroCarousel"
import { UniverseTiles } from "@/components/UniverseTiles"
import { Commitments, Faq, ScrollText } from "@/components/HomeSections"
import { ArrowIcon, ChatIcon, CheckIcon, ShieldIcon, TruckIcon, WalletIcon } from "@/components/icons"
import styles from "./home.module.css"

export const revalidate = 300

const WHY = [
  { icon: ShieldIcon, title: "Authenticité garantie", text: "Chaque soin vient de nos boutiques de Yopougon et Adjamé, où il est choisi et contrôlé. Nous ne vendons que ce que nous connaissons." },
  { icon: ChatIcon, title: "Conseil sincère", text: "Décrivez-nous votre peau : une conseillère vous oriente vers le soin adapté, sur WhatsApp, sans pression." },
  { icon: TruckIcon, title: "Livraison à Abidjan", text: "Partout dans la ville. Délai et frais confirmés avant l'envoi, selon votre quartier." },
  { icon: WalletIcon, title: "Paiement à la livraison", text: "En espèces ou Mobile Money. Vous ne payez qu'à la réception de votre colis." },
]

const VALUES = ["Soins authentiques", "Conseils personnalisés", "Deux boutiques à Abidjan", "Livraison partout en ville"]

/** Initials of a title, small words left out: "Paiement à la livraison" → "PL" */
const SMALL = new Set(["à", "la", "le", "les", "de", "des", "du", "et", "en", "l"])
const initials = (t: string) => t.split(/[\s'’-]+/).filter((w) => w && !SMALL.has(w.toLowerCase())).map((w) => w[0].toUpperCase()).join("").slice(0, 2)

/** Label on the page thread: "Nos coups de cœur." → "Coups de cœur" */
const station = (title: string) => { const t = title.replace(/\.$/, "").replace(/^Nos /, ""); return t[0].toUpperCase() + t.slice(1) }

function Row({ script, title, text, products, href, favourites }: { script: string; title: string; text: string; products: SiteProduct[]; href: string; favourites?: boolean }) {
  if (!products.length) return null
  return (
    <section className="section reveal" data-station={station(title)}>
      <div className="container">
        <div className="section-head">
          <div>
            <span className="script text-gold">{script}</span>
            <h2 className="section-title">{title}</h2>
            <p>{text}</p>
          </div>
          <Link href={href} className="link-more">Tout voir <ArrowIcon size={16} /></Link>
        </div>
        <div className={`${styles.grid} stagger`}>
          {products.map((p) => <ProductCard key={p.id} product={toCard(p)} favourites={favourites} />)}
        </div>
      </div>
    </section>
  )
}

export default async function Home() {
  const [products, universes, content, packs] = await Promise.all([getProducts(), getUniverseCards(), getSiteContent(), getPacks()])
  const all = withPhotosFirst(products)
  const pick = (f: (p: SiteProduct) => boolean, n = 8) => all.filter(f).slice(0, n)

  // every row is chosen in the web app (Produits › Modifier › Site e-commerce); an empty row is not shown
  const favourites = pick((p) => p.featured)
  const bestsellers = pick((p) => p.bestseller)
  const news = pick((p) => p.isNew)
  // "Meilleures sélections pour vous": ticked in the web app, 3 at most
  const spotlight = pick((p) => p.spotlight, 3).map((p) => ({ ...toCard(p), pitch: p.pitch || p.description }))
  const brands = new Set(all.map((p) => p.brand).filter(Boolean)).size
  const { hero, about, advice } = content

  // the posters of the backoffice; none yet: the brand slide (backoffice texts)
  const slides: HeroSlide[] = content.posters.length
    ? content.posters.map((p, i) => p.brandText
      // the texts of the brand slide over the poster; its button leads to the poster's link
      ? { eyebrow: hero.eyebrow, title: hero.title, subtitle: hero.subtitle, text: hero.text, image: null,
          link: p.link || "/boutique", cta: p.label || hero.cta, script: true, poster: p }
      : { eyebrow: "", title: p.label || `Affiche ${i + 1}`, text: "", image: null, link: p.link, cta: p.label, poster: p })
    : [{
        eyebrow: hero.eyebrow,
        title: hero.title,
        subtitle: hero.subtitle,
        text: hero.text,
        image: isSiteImage(hero.image) ? hero.image : null,
        link: "/boutique",
        cta: hero.cta,
        script: true,
      }]

  return (
    <>
      <HeroCarousel slides={slides} />

      <Spotlight products={spotlight} />

      {/* --- UNIVERSES --- */}
      <section id="univers" className={styles.universes} data-station="Univers">
        <div className={`${styles.universesHead} reveal`}>
          <div>
            <span className="script text-gold">À chacun son rituel</span>
            <h2 className="section-title">Nos univers.</h2>
          </div>
          <p>Survolez un univers pour en découvrir plus.</p>
        </div>
        <UniverseTiles universes={universes} />
      </section>

      <Row script="La sélection de nos conseillères" title="Nos coups de cœur." text="Les soins que nos conseillères recommandent le plus souvent." products={favourites} href="/boutique" favourites />

      {/* --- PACKS --- */}
      {packs.length > 0 && (
        <section className={`${styles.packs} reveal`} data-station="Packs">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="script text-gold">{content.packs.eyebrow}</span>
                <h2 className="section-title">{content.packs.title}</h2>
                <p>{content.packs.text}</p>
              </div>
              <Link href="/packs" className="link-more">Tous les packs <ArrowIcon size={16} /></Link>
            </div>
            <div className={`${styles.packGrid} stagger`}>
              {packs.slice(0, 3).map((p) => <PackCard key={p.id} pack={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* --- FIGURES --- */}
      <section className="section reveal" data-station="Engagements">
        <div className="container">
          <Commitments
            items={[
              { value: `${all.length}+`, label: "soins en ligne", text: "Visage, corps, bébé, bien-être : toute notre sélection." },
              { value: `${brands}`, label: "marques", text: "Des marques reconnues et des pépites à découvrir." },
              { value: "2", label: "boutiques", text: "À Yopougon et à Adjamé, pour voir et sentir avant d'acheter." },
              { value: "100%", label: "authentiques", text: "Des produits contrôlés, que nous connaissons." },
            ]}
          />
        </div>
      </section>

      {/* --- ABOUT: editorial split, sticky visual + statement revealed while scrolling --- */}
      <section className={`${styles.about} reveal`} data-station="Qui sommes-nous">
        <span className={styles.aboutMark} aria-hidden="true">HARI</span>
        <div className={styles.aboutGrid}>
          <div className={styles.aboutVisual}>
            <div className={`${styles.aboutPhoto} ${isSiteImage(about.image) ? styles.aboutCover : ""}`}>
              {isSiteImage(about.image) ? (
                <Image src={about.image} alt={about.title} fill sizes="(max-width: 1000px) 100vw, 45vw" className="img-reveal" />
              ) : (
                <Image src="/haristore.png" alt={SITE.fullName} width={520} height={400} className="img-reveal" />
              )}
            </div>
            <div className={styles.aboutBadge}>
              <strong className="text-gold">{SITE.fullName}</strong>
              <span>Abidjan ( Faya · Yopougon )</span>
            </div>
          </div>
          <div className={styles.aboutBody}>
            <span className="script text-gold">{about.eyebrow}</span>
            <h2 className={styles.aboutTitle}>{about.title}</h2>
            <ScrollText className={styles.aboutText} text={about.text} />
            <ul className={`${styles.aboutValues} stagger`}>
              {VALUES.map((v, i) => (
                <li key={v}>
                  <span className={styles.aboutCheck}><CheckIcon size={16} /></span>
                  <span className={styles.aboutValue}>{v}</span>
                  <small>{String(i + 1).padStart(2, "0")}</small>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Row script="Tout juste arrivés" title="Nouveautés." text="Les derniers arrivés en boutique." products={news} href="/boutique?tri=nouveautes" />
      <Row script="Elles les adorent" title="Meilleures ventes." text="Ce que nos clientes rachètent, encore et encore." products={bestsellers} href="/boutique?tri=ventes" />

      {/* --- WHY US: sticky intro + cards that stack on top of each other while scrolling --- */}
      <section className={styles.why} data-station="Nos atouts">
        <div className={styles.whyGrid}>
          <div className={styles.whyIntro}>
            <span className="script text-gold">Nos atouts</span>
            <h2 className={styles.whyTitle}>Pourquoi Hari Store ?</h2>
            <p className={styles.whyLead}>{WHY.length} raisons de nous confier le soin de votre peau.</p>
            <Link href="/boutique" className="btn btn-dark">Découvrir la boutique <ArrowIcon size={18} /></Link>
          </div>
          <ol className={styles.whyStack}>
            {WHY.map((w, i) => (
              <li key={w.title} className={`${styles.whyCard} ${i % 2 ? styles.whyLight : ""}`} style={{ ["--i" as string]: i }}>
                <span className={styles.whyNum} aria-hidden="true">{initials(w.title)}</span>
                <span className={styles.whyIcon}><w.icon size={26} /></span>
                <div className={styles.whyText}>
                  <h3>{w.title}</h3>
                  <p>{w.text}</p>
                </div>
                <span className={styles.whyCount}>{i + 1} / {WHY.length}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>


      {/* --- FAQ --- */}
      <section className="section-gray reveal" data-station="Questions">
        <div className="container">
          <Faq />
        </div>
      </section>

      {/* --- ADVICE --- */}
      <section className={`${styles.advice} reveal`} data-station="Conseil">
        <div className={`container ${styles.adviceInner}`}>
          <div>
            <p className={`script text-gold ${styles.adviceEyebrow}`}>{advice.eyebrow}</p>
            <h2>{advice.title}</h2>
            <p>{advice.text}</p>
          </div>
          {SITE.whatsapp ? (
            <a href={whatsappLink(`Bonjour ${SITE.name}, j'aimerais un conseil pour ma peau.`)} target="_blank" rel="noopener" className={`btn btn-real-gold ${styles.adviceCta}`}>
              Demander conseil <ArrowIcon size={18} />
            </a>
          ) : (
            <Link href="/boutique" className={`btn btn-real-gold ${styles.adviceCta}`}>Voir les soins <ArrowIcon size={18} /></Link>
          )}
        </div>
      </section>

      {/* --- REVIEWS: right above the footer --- */}
      <Testimonials items={content.testimonials} />

      {/* --- OUR SHOPS, right above the footer: a simple Google map (Backoffice › Nos boutiques) --- */}
      {content.shops.length > 0 && <section className="section reveal" data-station="Nos boutiques">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="script text-gold">Venez nous voir</span>
              <h2 className="section-title">Nos boutiques.</h2>
              <p>Nos adresses à Abidjan, pour voir, sentir et essayer avant d&apos;acheter.</p>
            </div>
          </div>
          <ShopsMap shops={content.shops} />
        </div>
      </section>}
    </>
  )
}
