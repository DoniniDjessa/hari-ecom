export const SITE = {
  name: "Hari Store",
  fullName: "Hari Store Cosmetics",
  description:
    "Cosmétiques authentiques à Abidjan : soins visage, corps, bébé et bien-être choisis par nos conseillères. Livraison partout à Abidjan, paiement à la livraison.",
  // the address of the site in production (canonical links, sitemap, Google data): with www, the address
  // Vercel serves (haristorecosmetics.com redirects to it)
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.haristorecosmetics.com",
  // shop that receives the orders (international format, digits only)
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, ""),
  // the shop's Wave payment link (Wave Business › lien de paiement): opens the Wave app to pay
  waveLink: process.env.NEXT_PUBLIC_WAVE_LINK || "https://pay.wave.com/m/M_ci_LfyIheW2bq7H/c/ci/",
}

/** Paying with Wave adds 1 % to the articles (Wave's fee): 15 000 → 15 150. Rounded up to the franc, in whole
 *  numbers (n * 1.01 would give 15 150.000000000002). The order keeps the articles' total; only the Wave
 *  payment carries the fee. */
export const WAVE_FEE_PERCENT = 1
export const waveFee = (total: number) => Math.ceil((Math.round(total) * WAVE_FEE_PERCENT) / 100)
export const waveAmount = (total: number) => Math.round(total) + waveFee(total)

/** The Wave link with the amount filled in (the client still sees it in Wave before paying) */
export const waveLink = (amount: number) => `${SITE.waveLink}?amount=${Math.round(amount)}`

// the universes of the web app (lib/product-taxonomy.ts in haritest), in the order shown on the site
export const UNIVERSES = [
  { name: "Visage", slug: "visage", tagline: "Sérums, crèmes et nettoyants" },
  { name: "Corps", slug: "corps", tagline: "Laits, huiles et gommages" },
  { name: "Bébé & enfant", slug: "bebe-enfant", tagline: "Douceur pour les tout-petits" },
  { name: "Bien-être", slug: "bien-etre", tagline: "Compléments et rituels" },
  { name: "Hygiène", slug: "hygiene", tagline: "Le quotidien, en mieux" },
  { name: "Cheveux", slug: "cheveux", tagline: "Shampoings et soins" },
]

/** Price set to 1 F in the web app = price not known yet (filled in later): such products are not on the site
 *  and cannot be ordered, as products without a price (0 F). Only exactly 1 F (2 F is a real price). */
export const NO_PRICE = 1
export const hasPrice = (price: number) => price > 0 && price !== NO_PRICE

export const universeBySlug = (slug: string) => UNIVERSES.find((u) => u.slug === slug)

export const formatPrice = (n: number) => `${Math.round(n).toLocaleString("fr-FR").replace(/ | /g, " ")} FCFA`

export const whatsappLink = (text: string) =>
  `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`
