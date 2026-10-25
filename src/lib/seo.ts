import { SITE } from "./site"

// Search engines: absolute links, the "needs" landing pages, and the schema.org data (JSON-LD) Google
// reads to show prices, stock, stars and breadcrumbs in its results.

/** Absolute address on the site: https://haristorecosmetics.com/produit/… */
export const abs = (path: string) => (/^https?:\/\//.test(path) ? path : `${SITE.url.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`)

/** A need (= a benefit of the web app): its page /besoins/<slug>, its title and an intro written for it */
export type Need = { slug: string; benefit: string; title: string; text: string }

export const NEEDS: Need[] = [
  { slug: "eclaircissant", benefit: "Éclaircissant", title: "Soins éclaircissants", text: "Laits, crèmes, sérums et savons qui éclaircissent la peau en douceur et unifient le teint, choisis par nos conseillères pour un résultat lumineux et homogène." },
  { slug: "eclat", benefit: "Éclat", title: "Soins éclat", text: "Pour un teint lumineux et une peau qui rayonne : nos soins éclat ravivent la peau terne et lui redonnent de la vitalité au quotidien." },
  { slug: "hydratant", benefit: "Hydratant", title: "Soins hydratants", text: "Une peau bien hydratée est une peau douce, souple et protégée. Découvrez nos soins hydratants pour le visage et le corps, adaptés au climat d'Abidjan." },
  { slug: "anti-taches", benefit: "Anti-taches", title: "Soins anti-taches", text: "Taches brunes, marques d'acné, hyperpigmentation : nos soins anti-taches atténuent les marques et aident à retrouver un teint uniforme." },
  { slug: "unifiant", benefit: "Unifiant", title: "Soins unifiants", text: "Pour un teint régulier, sans zones plus foncées : des soins qui unifient la carnation du visage et du corps." },
  { slug: "nourrissant", benefit: "Nourrissant", title: "Soins nourrissants", text: "Beurres, huiles et crèmes riches pour nourrir les peaux sèches et leur rendre confort et douceur." },
  { slug: "protection-solaire", benefit: "Protection solaire", title: "Protection solaire", text: "Le soleil d'Abidjan accentue les taches : protégez votre peau chaque jour avec nos soins à filtre solaire, pour le visage et le corps." },
  { slug: "exfoliant", benefit: "Exfoliant", title: "Gommages et exfoliants", text: "Gommages au sucre, au sel ou aux acides doux : ils éliminent les cellules mortes pour une peau lisse, nette et lumineuse." },
  { slug: "reparateur", benefit: "Réparateur", title: "Soins réparateurs", text: "Pour les peaux abîmées, irritées ou fragilisées : des soins qui réparent la barrière cutanée et apaisent." },
  { slug: "apaisant", benefit: "Apaisant", title: "Soins apaisants", text: "Rougeurs, tiraillements, sensibilité : nos soins apaisants calment la peau et lui rendent son confort." },
  { slug: "anti-acne", benefit: "Anti-acné", title: "Soins anti-acné", text: "Boutons, points noirs, excès de sébum : des soins ciblés pour purifier la peau et limiter les imperfections, sans l'agresser." },
  { slug: "raffermissant", benefit: "Raffermissant", title: "Soins raffermissants", text: "Pour une peau plus ferme et tonique : des soins qui raffermissent et lissent le corps et le visage." },
  { slug: "purifiant", benefit: "Purifiant", title: "Soins purifiants", text: "Nettoyants, masques et toniques qui débarrassent la peau des impuretés et resserrent les pores." },
  { slug: "anti-age", benefit: "Anti-âge", title: "Soins anti-âge", text: "Rides, perte de fermeté, teint fatigué : nos soins anti-âge accompagnent les peaux matures." },
  { slug: "anti-vergetures", benefit: "Anti-vergetures", title: "Soins anti-vergetures", text: "Huiles et crèmes qui préviennent et atténuent l'apparence des vergetures, pendant et après la grossesse notamment." },
]

export const needBySlug = (slug: string) => NEEDS.find((n) => n.slug === slug)

/** <script type="application/ld+json"> content: "<" escaped so a text can never close the script */
export const ldJson = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c")

export const breadcrumbLd = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
})
