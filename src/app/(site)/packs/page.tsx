import type { Metadata } from "next"
import Link from "next/link"
import { getPacks } from "@/lib/packs"
import { getSiteContent } from "@/lib/backoffice"
import { PackCard } from "@/components/PackCard"
import styles from "./packs.module.css"

export const revalidate = 300
export const metadata: Metadata = { title: "Nos packs" }

export default async function Packs() {
  const [packs, content] = await Promise.all([getPacks(), getSiteContent()])
  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <nav className={styles.crumbs} aria-label="Fil d'Ariane">
          <Link href="/">Accueil</Link><span>/</span><span>Nos packs</span>
        </nav>
        <span className="script text-gold">{content.packs.eyebrow}</span>
        <h1>{content.packs.title}</h1>
        <p>{content.packs.text}</p>
      </div>
      <div className="container">
        {packs.length ? (
          <div className={styles.grid}>
            {packs.map((p) => <PackCard key={p.id} pack={p} />)}
          </div>
        ) : (
          <div className={styles.empty}>
            <span className="script text-gold">Bientôt</span>
            <h2>Nos premiers packs arrivent.</h2>
            <p>En attendant, composez votre rituel dans la boutique.</p>
            <Link href="/boutique" className="btn btn-dark">Aller à la boutique</Link>
          </div>
        )}
      </div>
    </div>
  )
}
