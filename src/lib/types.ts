/** A product as the site shows it (read from hari-products, the web app's catalogue) */
export interface SiteProduct {
  id: string
  code: string
  slug: string
  name: string
  brand: string
  /** what the client pays: the flash price while a flash sale runs (web app › Paramètres › Ventes flash) */
  price: number
  /** the usual price, crossed out, while a flash sale runs; null otherwise */
  oldPrice: number | null
  /** end of that flash sale (ISO), for the countdown */
  promoEnds: string | null
  /** /api/img/… (the website photo), null until it is generated or uploaded */
  image: string | null
  universe: string
  form: string
  volume: string
  description: string
  pitch: string
  usage: string
  /** when to use it (Matin, Soir, Après la douche…) */
  moments: string[]
  precautions: string
  /** ingredients to watch (allergies…) */
  alertIngredients: string[]
  /** the brand's range (Butter Glow, Hydra Sebiaclear…) */
  range: string
  benefits: string[]
  skinTypes: string[]
  hairTypes: string[]
  targets: string[]
  keyIngredients: string[]
  lots: { quantity: number; price: number }[]
  /** "Nouveau" badge (web app: site_new) */
  isNew: boolean
  bestseller: boolean
  featured: boolean
  /** one of the "Meilleures sélections pour vous" (web app: site_spotlight) */
  spotlight: boolean
  /** own badge chosen in the web app (Exclusivité, Bio…), "" when none */
  badge: string
  rating: number | null
  reviews: number
  inStock: boolean
  /** units left in both shops (product page: "Plus que 3 en stock") */
  stock: number
  createdAt: string
}

/** What a product card and the catalogue filters need (the long texts stay on the server) */
export type CardProduct = Pick<SiteProduct,
  "id" | "code" | "slug" | "name" | "brand" | "price" | "oldPrice" | "promoEnds" | "image" | "universe" | "form" | "benefits" | "skinTypes"
  | "hairTypes" | "targets"
  | "isNew" | "bestseller" | "featured" | "badge" | "rating" | "reviews" | "inStock" | "createdAt" | "volume"> & {
  /** the best "n for x" offer, shown under the price */
  lot: { quantity: number; price: number } | null
  /** key ingredients and ingredients to watch (skin diagnosis: what to avoid) */
  ingredients: string[]
}

export const toCard = (p: SiteProduct): CardProduct => ({
  id: p.id, code: p.code, slug: p.slug, name: p.name, brand: p.brand, price: p.price, oldPrice: p.oldPrice, promoEnds: p.promoEnds, image: p.image,
  universe: p.universe, form: p.form, benefits: p.benefits, skinTypes: p.skinTypes, hairTypes: p.hairTypes,
  targets: p.targets, isNew: p.isNew,
  bestseller: p.bestseller, featured: p.featured, badge: p.badge, rating: p.rating, reviews: p.reviews, inStock: p.inStock,
  createdAt: p.createdAt, volume: p.volume,
  lot: [...p.lots].sort((a, b) => a.price / a.quantity - b.price / b.quantity)[0] ?? null,
  ingredients: [...p.keyIngredients, ...p.alertIngredients],
})

/** A pack (web app › Paramètres › Packs) as the site shows it */
export interface SitePack {
  id: string
  slug: string
  name: string
  description: string
  price: number
  /** what the products cost one by one */
  value: number
  saving: number
  /** photo of the pack, or null: the site shows its products' photos */
  image: string | null
  /** badge chosen in the web app (Spécial Hari Store…), "" when none */
  badge: string
  items: { id: string; slug: string; name: string; brand: string; price: number; image: string | null; quantity: number; inStock: boolean }[]
  inStock: boolean
}

/** A universe (Visage, Corps…) as the menu, the hero and the tiles show it */
export interface UniverseCard {
  name: string
  slug: string
  tagline: string
  count: number
  image: string | null
  /** round image chosen in the backoffice, shown on the tile instead of the photos / the initial */
  roundImage: string | null
  /** up to 3 product photos of the universe, fanned on its tile */
  images: { src: string; name: string }[]
  productName: string
  productSlug: string
  forms: string[]
}

/** What the cart keeps (in the browser): enough to show the line without reloading the product */
export interface CartLine {
  id: string
  slug: string
  name: string
  brand: string
  price: number
  image: string | null
  quantity: number
  /** a pack: its page and what is inside (the order message lists it) */
  href?: string
  detail?: string
}

/** "-25 %" of a crossed-out price, 0 when there is none */
export const discount = (p: { price: number; oldPrice: number | null }) =>
  p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0
