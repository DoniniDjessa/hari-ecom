"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import type { UniverseCard } from "@/lib/types"
import { useCart } from "./CartProvider"
import { useFavourites } from "./Saved"
import { ProductVisual } from "./ProductVisual"
import { SideDrawer } from "./SideDrawer"
import { SearchSuggestions } from "./SearchSuggestions"
import { track } from "@/lib/track"
import type { Shop } from "@/lib/content"
import { ThemeToggle } from "./ThemeToggle"
import { ArrowIcon, BagIcon, ChevronIcon, CloseIcon, SearchIcon } from "./icons"
import styles from "./Navbar.module.css"

// Thin translucent bar (sngcompany). Left: the menu button (side menu sliding in from the left, on every
// screen; a swipe from the left edge of a phone opens it too) and the logo. Computer: the links, with the
// "Boutique" mega panel (universes + preview). Right: light / dark, search, cart.
export function Navbar({ universes, shops }: { universes: UniverseCard[]; shops: Shop[] }) {
  const { count, ready } = useCart()
  const { ready: favReady, favourites } = useFavourites()
  const router = useRouter()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [search, setSearch] = useState(false)
  const [q, setQ] = useState("")
  const [preview, setPreview] = useState(0)
  const shown = universes[preview] ?? universes[0]
  const input = useRef<HTMLInputElement>(null)
  const closeDrawer = useCallback(() => setDrawer(false), [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setDrawer(false)
    setSearch(false)
  }, [pathname])

  useEffect(() => {
    if (search) input.current?.focus()
  }, [search])

  // phones: a swipe from the left edge opens the side menu
  useEffect(() => {
    let start: { x: number; y: number } | null = null
    const down = (e: TouchEvent) => {
      const t = e.touches[0]
      start = t.clientX < 24 ? { x: t.clientX, y: t.clientY } : null
    }
    const up = (e: TouchEvent) => {
      if (!start) return
      const t = e.changedTouches[0]
      if (t.clientX - start.x > 60 && Math.abs(t.clientY - start.y) < 60) setDrawer(true)
      start = null
    }
    document.addEventListener("touchstart", down, { passive: true })
    document.addEventListener("touchend", up, { passive: true })
    return () => {
      document.removeEventListener("touchstart", down)
      document.removeEventListener("touchend", up)
    }
  }, [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) track("search", { search_term: q.trim() })
    router.push(q.trim() ? `/boutique?q=${encodeURIComponent(q.trim())}` : "/boutique")
    setSearch(false)
  }

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
        <nav className={styles.nav} aria-label="Navigation principale">
          <div className={styles.container}>
            <div className={styles.left}>
              <button className={styles.hamburger} onClick={() => setDrawer(true)} aria-label="Ouvrir le menu" aria-expanded={drawer}>
                <span className={styles.bar} />
              </button>
              <Link href="/" className={styles.logo} aria-label="Hari Store, accueil">
                <Image src="/haristore-mark.png" alt="" width={46} height={29} priority />
                <span>Hari Store</span>
              </Link>
            </div>

            <ul className={styles.menu}>
              <li className={styles.menuItem}><Link href="/">Accueil</Link></li>
              <li className={`${styles.menuItem} ${styles.hasDropdown}`}>
                <Link href="/boutique">Boutique <ChevronIcon className={styles.caret} size={12} /></Link>
                {/* mega panel: universes on the left, preview of the hovered one on the right */}
                <div className={styles.dropdown}>
                  <div className={styles.megaList}>
                    <p className={styles.megaTitle}>Nos univers</p>
                    {universes.map((u, i) => (
                      <Link
                        key={u.slug}
                        href={`/boutique?univers=${u.slug}`}
                        className={`${styles.dropdownItem} ${i === preview ? styles.itemOn : ""}`}
                        style={{ ["--i" as string]: i }}
                        onPointerEnter={() => setPreview(i)}
                        onFocus={() => setPreview(i)}
                      >
                        <span className={styles.dropdownIcon}>{u.name[0]}</span>
                        <span className={styles.itemText}>
                          <strong>{u.name}</strong>
                          <small>{u.tagline}</small>
                        </span>
                        <ArrowIcon className={styles.itemArrow} size={16} />
                      </Link>
                    ))}
                  </div>
                  {shown && (
                    <Link href={`/boutique?univers=${shown.slug}`} className={styles.megaPreview} tabIndex={-1} aria-hidden="true">
                      <div key={shown.slug} className={styles.previewMedia}>
                        <ProductVisual src={shown.roundImage} alt="" brand={shown.name} sizes="260px" />
                      </div>
                      <div key={`t-${shown.slug}`} className={styles.previewText}>
                        <strong>{shown.name}</strong>
                        <p>{shown.count ? `${shown.count} soins · ${shown.forms.join(", ")}` : shown.tagline}</p>
                        <span>Découvrir <ArrowIcon size={14} /></span>
                      </div>
                    </Link>
                  )}
                </div>
              </li>
              <li className={styles.menuItem}><Link href="/packs" className={styles.packsLink}>Nos packs</Link></li>
              <li className={styles.menuItem}><Link href="/boutique?tri=nouveautes">Nouveautés</Link></li>
              <li className={styles.menuItem}><Link href="/boutique?tri=ventes">Meilleures ventes</Link></li>
            </ul>

            <div className={styles.actions}>
              <span className={styles.theme}><ThemeToggle /></span>
              <button type="button" className={styles.iconBtn} onClick={() => setSearch((s) => !s)} aria-label="Rechercher">
                <SearchIcon size={19} />
              </button>
              <Link href="/favoris" className={`${styles.iconBtn} ${styles.favLink}`} aria-label={`Mes favoris (${favourites.length})`}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.3 4.5 6.9 4.5c2.1 0 3.6 1.2 5.1 3 1.5-1.8 3-3 5.1-3 3.6 0 5.5 3.5 4.2 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z" />
                </svg>
                {favReady && favourites.length > 0 && <span key={favourites.length} className={styles.count}>{favourites.length > 99 ? "99+" : favourites.length}</span>}
              </Link>
              <Link href="/panier" className={styles.iconBtn} aria-label={`Panier (${count} article${count > 1 ? "s" : ""})`}>
                <BagIcon size={20} />
                {ready && count > 0 && <span key={count} className={styles.count}>{count > 99 ? "99+" : count}</span>}
              </Link>
              <Link href="/boutique" className={styles.ctaButton}>Commander</Link>
            </div>
          </div>
        </nav>

        {search && (
          <form className={styles.search} onSubmit={submit} role="search">
            <div className={styles.container}>
              <SearchIcon size={20} />
              <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Un soin, une marque, un besoin…" aria-label="Rechercher" />
              <button type="button" onClick={() => setSearch(false)} aria-label="Fermer la recherche"><CloseIcon size={20} /></button>
            </div>
            {/* suggestions while typing: products, brands, needs (typos forgiven) */}
            <div className={styles.suggest}>
              <SearchSuggestions query={q} onPick={() => { setSearch(false); setQ("") }} />
            </div>
          </form>
        )}
      </header>

      <SideDrawer open={drawer} onClose={closeDrawer} universes={universes} shops={shops} count={ready ? count : 0} />
    </>
  )
}
