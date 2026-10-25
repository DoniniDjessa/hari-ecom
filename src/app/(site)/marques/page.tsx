import type { Metadata } from "next"
import Link from "next/link"
import { getBrands } from "@/lib/catalog"
import { breadcrumbLd } from "@/lib/seo"
import { JsonLd } from "@/components/JsonLd"
import styles from "./marques.module.css"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Toutes nos marques de cosmétiques",
  description: "Toutes les marques de soins disponibles chez Hari Store à Abidjan : visage, corps, bébé et bien-être. Produits authentiques, livraison partout à Abidjan.",
  alternates: { canonical: "/marques" },
}

// Every brand, A → Z, grouped by first letter, with its number of products
export default async function Marques() {
  const brands = await getBrands()
  const groups = new Map<string, typeof brands>()
  for (const b of brands) {
    const l = b.name.normalize("NFD")[0].toUpperCase()
    const letter = /[A-Z]/.test(l) ? l : "#"
    groups.set(letter, [...(groups.get(letter) ?? []), b])
  }
  return (
    <div className={`container ${styles.page}`}>
      <JsonLd data={breadcrumbLd([{ name: "Accueil", path: "/" }, { name: "Marques", path: "/marques" }])} />
      <header className={styles.head}>
        <span className="script text-gold">De A à Z</span>
        <h1>Nos marques.</h1>
        <p>{brands.length} marques de soins authentiques, choisies dans nos boutiques d&apos;Abidjan.</p>
      </header>
      <nav className={styles.letters} aria-label="Lettres">
        {[...groups.keys()].map((l) => <a key={l} href={`#lettre-${l}`}>{l}</a>)}
      </nav>
      <div className={styles.groups}>
        {[...groups].map(([letter, list]) => (
          <section key={letter} id={`lettre-${letter}`} className={styles.group}>
            <h2>{letter}</h2>
            <ul>
              {list.map((b) => (
                <li key={b.slug}><Link href={`/marques/${b.slug}`}>{b.name} <span>{b.count}</span></Link></li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
