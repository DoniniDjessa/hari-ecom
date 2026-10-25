import Link from "next/link"
import Image from "next/image"
import { SITE, UNIVERSES, whatsappLink } from "@/lib/site"
import type { Shop, SiteContent } from "@/lib/content"
import { ChatIcon, TruckIcon, WalletIcon } from "./icons"
import styles from "./Footer.module.css"

export function Footer({ content, shops, social }: { content: SiteContent["footer"]; shops: Shop[]; social: SiteContent["social"] }) {
  const networks = ([["Instagram", social.instagram], ["TikTok", social.tiktok], ["Facebook", social.facebook]] as const).filter(([, url]) => url)
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
              <li><Link href="/marques">Toutes les marques</Link></li>
              <li><Link href="/besoins">Soins par besoin</Link></li>
              <li><Link href="/diagnostic">Diagnostic de peau</Link></li>
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
              {social.whatsappChannel && (
                <li><ChatIcon size={16} /> <a href={social.whatsappChannel} target="_blank" rel="noopener noreferrer">Notre chaîne WhatsApp : nouveautés et promos</a></li>
              )}
            </ul>
            <ul className={styles.list}>
              <li><Link href="/fidelite">Programme Hari Gold</Link></li>
              <li><Link href="/favoris">Mes favoris</Link></li>
              <li><Link href="/livraison-retours">Livraison et retours</Link></li>
            </ul>
            {networks.length > 0 && (
              <p className={styles.networks}>
                {networks.map(([name, url]) => <a key={name} href={url} target="_blank" rel="noopener noreferrer">{name}</a>)}
              </p>
            )}
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} {SITE.fullName}. Tous droits réservés.</p>
          <nav className={styles.legal} aria-label="Informations légales">
            <Link href="/cgv">CGV</Link>
            <Link href="/mentions-legales">Mentions légales</Link>
            <Link href="/confidentialite">Confidentialité</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
