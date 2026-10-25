"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { UniverseCard } from "@/lib/types"
import { SITE, whatsappLink } from "@/lib/site"
import { ThemeToggle } from "./ThemeToggle"
import { ArrowIcon, BagIcon, ChatIcon, CloseIcon, SearchIcon } from "./icons"
import { SearchSuggestions } from "./SearchSuggestions"
import styles from "./SideDrawer.module.css"
import type { Shop } from "@/lib/content"

/** quick searches under the search field */
const QUICK = ["Sérum", "Crème", "Huile", "Savon", "Gommage"]

// Side menu sliding in from the left, on every screen: search, the pages, the universes (with their image),
// the cart, light / dark and the contact. Swiping it to the left closes it.
export function SideDrawer({ open, onClose, universes, shops, count }: {
  open: boolean
  onClose: () => void
  universes: UniverseCard[]
  shops: Shop[]
  count: number
}) {
  const router = useRouter()
  const [q, setQ] = useState("")
  const touch = useRef<number | null>(null)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  const find = (term: string) => {
    router.push(term.trim() ? `/boutique?q=${encodeURIComponent(term.trim())}` : "/boutique")
    onClose()
  }
  const search = (e: React.FormEvent) => {
    e.preventDefault()
    find(q)
  }

  return (
    <div className={`${styles.root} ${open ? styles.open : ""}`} aria-hidden={!open}>
      <div className={styles.backdrop} onClick={onClose} />
      <aside
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current !== null && e.changedTouches[0].clientX - touch.current < -60) onClose()
          touch.current = null
        }}
        onClick={(e) => (e.target as HTMLElement).closest("a") && onClose()}
      >
        <div className={styles.head}>
          <Link href="/" className={styles.logo} tabIndex={open ? 0 : -1}>
            <Image src="/haristore-mark.png" alt="" width={44} height={28} />
            <span>Hari Store</span>
          </Link>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Fermer le menu" tabIndex={open ? 0 : -1}>
            <CloseIcon size={20} />
          </button>
        </div>

        {/* search: a gold pill with its round button, then a few quick searches */}
        <div className={styles.finder}>
          <span className={`script ${styles.finderTitle}`}>Que cherchez-vous ?</span>
          <form className={styles.search} onSubmit={search} role="search">
            <SearchIcon size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Un soin, une marque…" aria-label="Rechercher" tabIndex={open ? 0 : -1} />
            <button type="submit" className={styles.searchGo} aria-label="Lancer la recherche" tabIndex={open ? 0 : -1}>
              <ArrowIcon size={18} />
            </button>
          </form>
          <SearchSuggestions query={q} onPick={onClose} compact />
          {q.trim().length < 2 && <div className={styles.quick}>
            {QUICK.map((t) => (
              <button key={t} type="button" onClick={() => find(t)} tabIndex={open ? 0 : -1}>{t}</button>
            ))}
          </div>}
        </div>

        <nav className={styles.nav} aria-label="Menu">
          <Link href="/" style={{ ["--i" as string]: 0 }} tabIndex={open ? 0 : -1}>Accueil</Link>
          <Link href="/boutique" style={{ ["--i" as string]: 1 }} tabIndex={open ? 0 : -1}>Boutique</Link>
          <ul className={styles.universes} style={{ ["--i" as string]: 2 }}>
            {universes.map((u) => {
              const img = u.roundImage
              return (
                <li key={u.slug}>
                  <Link href={`/boutique?univers=${u.slug}`} tabIndex={open ? 0 : -1}>
                    <span className={styles.thumb}>
                      {img ? <Image src={img} alt="" fill sizes="40px" /> : <span>{u.name[0]}</span>}
                    </span>
                    <span className={styles.uText}><strong>{u.name}</strong><small>{u.count ? `${u.count} soins` : "Bientôt"}</small></span>
                    <ArrowIcon size={14} />
                  </Link>
                </li>
              )
            })}
          </ul>
          <Link href="/packs" className={`${styles.gold} text-gold`} style={{ ["--i" as string]: 3 }} tabIndex={open ? 0 : -1}>Nos packs</Link>
          <Link href="/boutique?tri=nouveautes" style={{ ["--i" as string]: 4 }} tabIndex={open ? 0 : -1}>Nouveautés</Link>
          <Link href="/boutique?tri=ventes" style={{ ["--i" as string]: 5 }} tabIndex={open ? 0 : -1}>Meilleures ventes</Link>
          <Link href="/diagnostic" style={{ ["--i" as string]: 6 }} tabIndex={open ? 0 : -1}>Diagnostic de peau</Link>
          <Link href="/marques" style={{ ["--i" as string]: 7 }} tabIndex={open ? 0 : -1}>Nos marques</Link>
          <Link href="/favoris" style={{ ["--i" as string]: 8 }} tabIndex={open ? 0 : -1}>Mes favoris</Link>
          <Link href="/fidelite" className={`${styles.gold} text-gold`} style={{ ["--i" as string]: 9 }} tabIndex={open ? 0 : -1}>Hari Gold</Link>
          <Link href="/panier" className={styles.cart} style={{ ["--i" as string]: 10 }} tabIndex={open ? 0 : -1}>
            <BagIcon size={22} /> Panier {count > 0 && <em>{count}</em>}
          </Link>
        </nav>

        <div className={styles.foot}>
          <ThemeToggle labelled />
          {SITE.whatsapp && (
            <a href={whatsappLink(`Bonjour ${SITE.name}, j'aimerais un conseil.`)} target="_blank" rel="noopener noreferrer" className={styles.wa} tabIndex={open ? 0 : -1}>
              <ChatIcon size={18} /> Un conseil sur WhatsApp
            </a>
          )}
          <p className={`script text-gold ${styles.sign}`}>Avec soin, Hari Store</p>
          <p className={styles.shops}>{shops.map((s) => s.city || s.name).join(" · ")}</p>
        </div>
      </aside>
    </div>
  )
}
