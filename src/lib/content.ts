// Texts and images of the site edited in the backoffice (/backoffice), stored in hari-site-settings
// (key "site_content"). Every field has a default: an empty field in the backoffice shows the default.

/** A poster of the home carousel (made outside, uploaded in the backoffice) */
export interface Poster {
  /** computer: 1920 × 900 (32:15) */
  image: string
  /** phone: 1080 × 1350 (4:5), optional (else the computer one) */
  mobile: string
  /** where a click leads (/packs, /boutique?univers=visage…), optional */
  link: string
  /** button drawn over the poster, optional */
  label: string
  /** the texts of the brand slide over the poster (off for a poster that has its own text) */
  brandText: boolean
}

/** A client's review, written in the backoffice (real reviews only) */
export interface Testimonial {
  name: string
  /** commune / city, optional */
  city: string
  text: string
  /** 1 to 5 */
  rating: number
  /** product talked about, optional */
  product: string
}

/** A shop: its card in "Nos boutiques" (Google map), the footer and the side menu */
export interface Shop {
  name: string
  /** commune, shown under the name */
  city: string
  /** position on the map (Google Maps: right click on the place → the coordinates) */
  lat: number
  lng: number
}

export interface SiteContent {
  /** home carousel; empty: the brand slide (hero texts) */
  posters: Poster[]
  hero: { eyebrow: string; title: string; subtitle: string; text: string; cta: string; image: string }
  about: { eyebrow: string; title: string; text: string; image: string }
  advice: { eyebrow: string; title: string; text: string }
  packs: { eyebrow: string; title: string; text: string }
  footer: { description: string; signature: string }
  /** by universe slug: tagline + round image shown on its tile */
  universes: Record<string, { tagline: string; image: string }>
  /** order of the universes on the site (slugs); empty: the web app's order */
  universeOrder: string[]
  /** "Ce que disent nos clients" (home, above the footer); empty: the section is hidden */
  testimonials: Testimonial[]
  /** our shops; empty: the "Nos boutiques" section is hidden */
  shops: Shop[]
}

export const DEFAULT_CONTENT: SiteContent = {
  posters: [],
  hero: {
    eyebrow: "Hari Store Cosmetics",
    title: "La beauté,",
    subtitle: "entre de bonnes mains.",
    text: "Soins visage, corps, bébé et bien-être choisis dans nos boutiques de Yopougon et Adjamé. Livrés chez vous à Abidjan.",
    cta: "Découvrir la boutique",
    image: "",
  },
  about: {
    eyebrow: "Qui sommes-nous",
    title: "Le soin juste, pour chaque peau.",
    text: "Hari Store, ce sont deux boutiques de cosmétiques à Abidjan et une conviction : chaque peau mérite un soin choisi avec attention. Nous sélectionnons nos produits un à un, nous les connaissons, et nous prenons le temps de vous conseiller. Aujourd'hui, toute notre sélection vous attend en ligne.",
    image: "",
  },
  advice: {
    eyebrow: "Conseil beauté",
    title: "Vous hésitez ? Parlons de votre peau.",
    text: "Teint, sensibilité, taches, hydratation : décrivez-nous votre besoin, nous vous guidons vers le bon soin.",
  },
  packs: {
    eyebrow: "Offerts à petit prix",
    title: "Nos packs.",
    text: "Des rituels complets, composés par nos conseillères, à un prix plus doux que les produits pris un à un.",
  },
  footer: {
    description: "Soins visage, corps, bébé et bien-être, choisis avec exigence dans nos boutiques d'Abidjan. Produits authentiques, conseils sincères.",
    signature: "Avec soin, Hari Store",
  },
  universes: {},
  universeOrder: [],
  testimonials: [],
  // first positions, to replace in the backoffice with the exact ones
  shops: [
    { name: "Hari Store Yopougon", city: "Yopougon, Abidjan", lat: 5.3411, lng: -4.0786 },
    { name: "Hari Store Cocody", city: "Cocody, Abidjan", lat: 5.3599, lng: -3.9871 },
  ],
}

type Obj = Record<string, unknown>
export const MAX_POSTERS = 8
export const MAX_TESTIMONIALS = 12
export const MAX_SHOPS = 6

/** a link of the site (/…) or an https address */
const isSafeLink = (l: string) => /^\/(?!\/)[\w\-./?=&%#]*$/.test(l) || /^https:\/\/[^\s]+$/.test(l)
const str = (v: unknown) => (typeof v === "string" ? v : "")

/** Saved content over the defaults, field by field (an empty saved field keeps the default) */
export function mergeContent(saved: unknown): SiteContent {
  const s = (saved && typeof saved === "object" ? saved : {}) as Obj
  const section = <K extends Exclude<keyof SiteContent, "universes" | "universeOrder" | "posters" | "testimonials" | "shops">>(k: K): SiteContent[K] => {
    const d = DEFAULT_CONTENT[k] as Record<string, string>
    const v = (s[k] && typeof s[k] === "object" ? s[k] : {}) as Obj
    return Object.fromEntries(Object.keys(d).map((f) => [f, str(v[f]).trim() || d[f]])) as SiteContent[K]
  }
  const u = (s.universes && typeof s.universes === "object" ? s.universes : {}) as Record<string, Obj>
  const posters = (Array.isArray(s.posters) ? s.posters : []) as Obj[]
  const testimonials = (Array.isArray(s.testimonials) ? s.testimonials : []) as Obj[]
  return {
    posters: posters
      .map((p) => ({ image: str(p?.image).trim(), mobile: str(p?.mobile).trim(), link: str(p?.link).trim(), label: str(p?.label).trim(), brandText: p?.brandText !== false }))
      .filter((p) => isSiteImage(p.image))
      .map((p) => ({ ...p, mobile: isSiteImage(p.mobile) ? p.mobile : "", link: isSafeLink(p.link) ? p.link : "" }))
      .slice(0, MAX_POSTERS),
    hero: section("hero"),
    about: section("about"),
    advice: section("advice"),
    packs: section("packs"),
    footer: section("footer"),
    testimonials: testimonials
      .map((t) => ({
        name: str(t?.name).trim().slice(0, 60),
        city: str(t?.city).trim().slice(0, 60),
        text: str(t?.text).trim().slice(0, 600),
        rating: Math.min(5, Math.max(1, Math.round(Number(t?.rating) || 5))),
        product: str(t?.product).trim().slice(0, 120),
      }))
      .filter((t) => t.name && t.text)
      .slice(0, MAX_TESTIMONIALS),
    universes: Object.fromEntries(Object.entries(u).map(([slug, v]) => [slug, { tagline: str(v?.tagline).trim(), image: str(v?.image).trim() }])),
    universeOrder: (Array.isArray(s.universeOrder) ? s.universeOrder : []).map(str).filter((x) => /^[\w-]{1,40}$/.test(x)).slice(0, 30),
    // never saved: the first shops; saved (even empty): what the backoffice holds
    shops: !Array.isArray(s.shops) ? DEFAULT_CONTENT.shops : (s.shops as Obj[])
      .map((p) => ({ name: str(p?.name).trim().slice(0, 60), city: str(p?.city).trim().slice(0, 60), lat: Number(p?.lat), lng: Number(p?.lng) }))
      .filter((p) => p.name && Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180)
      .slice(0, MAX_SHOPS),
  }
}

/** Only images uploaded through the backoffice (haritest/ecom/…, served by /api/img) are accepted */
export const isSiteImage = (src: string) => /^\/api\/img\/haritest\/ecom\/[\w\-./]+$/.test(src) && !src.includes("..")

/** The universes in the order chosen in the backoffice; those not placed yet keep their place after them */
export function inUniverseOrder<T extends { slug: string }>(list: T[], order: string[]): T[] {
  const rank = (slug: string) => { const i = order.indexOf(slug); return i < 0 ? order.length + list.findIndex((u) => u.slug === slug) : i }
  return [...list].sort((a, b) => rank(a.slug) - rank(b.slug))
}
