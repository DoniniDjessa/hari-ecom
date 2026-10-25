import type { Metadata } from "next"
import Link from "next/link"
import { getProducts } from "@/lib/catalog"
import { breadcrumbLd, NEEDS } from "@/lib/seo"
import { JsonLd } from "@/components/JsonLd"
import { ArrowIcon } from "@/components/icons"
import styles from "./besoins.module.css"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Soins par besoin : éclat, taches, hydratation, acné…",
  description: "Trouvez le soin adapté à votre besoin : éclaircissant, anti-taches, hydratant, anti-acné, protection solaire… Conseils et livraison à Abidjan.",
  alternates: { canonical: "/besoins" },
}

export default async function Besoins() {
  const all = await getProducts()
  const needs = NEEDS.map((n) => ({ ...n, count: all.filter((p) => p.benefits.includes(n.benefit)).length })).filter((n) => n.count > 0)
  return (
    <div className={`container ${styles.page}`}>
      <JsonLd data={breadcrumbLd([{ name: "Accueil", path: "/" }, { name: "Besoins", path: "/besoins" }])} />
      <header className={styles.head}>
        <span className="script text-gold">Le bon soin</span>
        <h1>Que cherchez-vous pour votre peau ?</h1>
        <p>Choisissez votre besoin : nous avons rassemblé les soins qui y répondent. Pas sûre ? Faites notre <Link href="/diagnostic">diagnostic de peau</Link>.</p>
      </header>
      <ul className={`${styles.grid} stagger`}>
        {needs.map((n) => (
          <li key={n.slug}>
            <Link href={`/besoins/${n.slug}`} className={styles.card}>
              <strong>{n.title}</strong>
              <span>{n.text}</span>
              <small>{n.count} soin{n.count > 1 ? "s" : ""} <ArrowIcon size={15} /></small>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
