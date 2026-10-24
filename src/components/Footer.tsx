import Link from "next/link"
import Image from "next/image"
import { SITE, UNIVERSES, whatsappLink } from "@/lib/site"
import type { Shop, SiteContent } from "@/lib/content"
import { ChatIcon, TruckIcon, WalletIcon } from "./icons"
import styles from "./Footer.module.css"

export function Footer({ content, shops }: { content: SiteContent["footer"]; shops: Shop[] }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.column}>
            <Link href="/" className={styles.logo} aria-label="Hari Store, accueil">
              <Image src="/haristore-mark.png" alt="" width={52} height={33} />
              <span>Hari Store</span>
            </Link>
            <p className={styles.description}>{content.description}</p>
            <p className={`script text-gold ${styles.signature}`}>{content.signature}</p>
          </div>

          <div className={styles.column}>
            <h4 className={styles.title}>Boutique</h4>
            <ul className={styles.list}>
              {UNIVERSES.map((u) => (
                <li key={u.slug}><Link href={`/boutique?univers=${u.slug}`}>{u.name}</Link></li>
              ))}
              <li><Link href="/packs">Nos packs</Link></li>
            </ul>
          </div>

          <div className={styles.column}>
            <h4 className={styles.title}>Nos boutiques</h4>
            <ul className={styles.list}>
              {shops.map((s) => (
                <li key={s.name}>{s.name}<br /><span>{s.city}</span></li>
              ))}
            </ul>
          </div>

          <div className={styles.column}>
            <h4 className={styles.title}>Commander</h4>
            <ul className={styles.contactList}>
              <li><TruckIcon size={16} /> Livraison partout à Abidjan</li>
              <li><WalletIcon size={16} /> Paiement à la livraison, espèces ou Mobile Money</li>
              {SITE.whatsapp && (
                <li><ChatIcon size={16} /> <a href={whatsappLink(`Bonjour ${SITE.name}.`)} target="_blank" rel="noopener noreferrer">Conseil sur WhatsApp</a></li>
              )}
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} {SITE.fullName}. Tous droits réservés.</p>
          <p>Abidjan · Côte d&apos;Ivoire</p>
        </div>
      </div>
    </footer>
  )
}
