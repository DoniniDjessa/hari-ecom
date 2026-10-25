import Link from "next/link"
import styles from "./LegalPage.module.css"

// Frame of the legal pages: crumbs, title, date, the text, and the links to the other legal pages
const PAGES = [
  { href: "/livraison-retours", label: "Livraison et retours" },
  { href: "/cgv", label: "Conditions générales de vente" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/mentions-legales", label: "Mentions légales" },
]

export function LegalPage({ title, eyebrow, updated, children }: { title: string; eyebrow: string; updated: string; children: React.ReactNode }) {
  return (
    <article className={`container ${styles.page}`}>
      <nav className={styles.crumbs} aria-label="Fil d'Ariane">
        <Link href="/">Accueil</Link><span>/</span><span>{title}</span>
      </nav>
      <header className={styles.head}>
        <span className="script text-gold">{eyebrow}</span>
        <h1>{title}</h1>
        <p>Mise à jour : {updated}</p>
      </header>
      <div className={styles.body}>{children}</div>
      <nav className={styles.others} aria-label="Informations">
        {PAGES.filter((p) => p.label !== title).map((p) => <Link key={p.href} href={p.href}>{p.label}</Link>)}
      </nav>
    </article>
  )
}

/** "Label : value" lines, the empty ones left out */
export function Facts({ items }: { items: [string, string][] }) {
  const shown = items.filter(([, v]) => v.trim())
  if (!shown.length) return null
  return (
    <dl className={styles.facts}>
      {shown.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
    </dl>
  )
}
