"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { SITE, whatsappLink } from "@/lib/site"
import { useCart } from "./CartProvider"
import { BagIcon } from "./icons"
import styles from "./Extras.module.css"

/** Fades in every `.reveal` block when it scrolls into view (re-run on each page) */
export function RevealOnScroll() {
  const pathname = usePathname()
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("active")),
      { threshold: 0.1 },
    )
    // blocks rendered later (filters, "Voir plus") are picked up too
    const watch = () => document.querySelectorAll(".reveal:not(.active)").forEach((el) => observer.observe(el))
    watch()
    const mutations = new MutationObserver(watch)
    mutations.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      mutations.disconnect()
    }
  }, [pathname])
  return null
}

/** Floating button: WhatsApp for a piece of advice; as soon as the cart holds something, the cart takes its
 *  place (with its counter), except on the cart page itself */
export function WhatsAppWidget() {
  const { count, ready } = useCart()
  const pathname = usePathname()
  if (ready && count > 0 && pathname !== "/panier") {
    return (
      <Link href="/panier" className={`${styles.widget} ${styles.cartWidget}`} aria-label={`Voir le panier : ${count} article${count > 1 ? "s" : ""}`}>
        <span className={styles.iconWrapper}>
          <BagIcon size={24} />
          <span key={count} className={styles.cartCount}>{count > 99 ? "99+" : count}</span>
        </span>
        <span className={styles.label}>Voir mon panier</span>
      </Link>
    )
  }
  if (!SITE.whatsapp) return null
  return (
    <a
      href={whatsappLink(`Bonjour ${SITE.name}, j'aimerais un conseil.`)}
      className={styles.widget}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Écrire à ${SITE.name} sur WhatsApp`}
    >
      <span className={styles.iconWrapper}>
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.005 0C5.37 0 .002 5.368.002 12.006c0 2.092.548 4.136 1.592 5.933L0 24l6.39-1.677a11.85 11.85 0 005.615 1.43h.005c6.635 0 12.003-5.368 12.003-12.006 0-3.212-1.25-6.234-3.522-8.504" />
        </svg>
      </span>
      <span className={styles.label}>Un conseil ? Écrivez-nous</span>
    </a>
  )
}

export function GoToTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  return (
    <button
      className={`${styles.goTop} ${visible ? styles.visible : ""}`}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Revenir en haut"
    >
      ↑
    </button>
  )
}

/** Loader, as a cosmetic: a drop of golden serum falls, splashes into ripples, the mark appears and the
 *  name is written by hand; then the powder compact opens (its two halves part along a gold seam).
 *  Full page load: ~3.5 s, flagged before paint by the inline script of app/(site)/layout.tsx.
 *  Navigation to another page: a click on a link closes the compact ("hari-intro-hold", the mark breathes
 *  while the next page loads), then it opens again (~0.7 s). */
export function Intro() {
  const pathname = usePathname()
  const firstPath = useRef(pathname)

  useEffect(() => {
    const html = document.documentElement
    let safety: ReturnType<typeof setTimeout> | undefined
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.("a")
      if (!a || !a.href || a.hasAttribute("download") || (a.target && a.target !== "_self")) return
      const url = new URL(a.href, location.href)
      // same page with other filters (?univers=) or an anchor: no curtain
      if (url.origin !== location.origin || url.pathname === location.pathname) return
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
      html.classList.add("hari-intro", "hari-intro-nav", "hari-intro-hold")
      clearTimeout(safety)
      safety = setTimeout(() => html.classList.remove("hari-intro", "hari-intro-nav", "hari-intro-hold"), 8000)
    }
    document.addEventListener("click", onClick)
    return () => {
      document.removeEventListener("click", onClick)
      clearTimeout(safety)
    }
  }, [])

  useEffect(() => {
    const html = document.documentElement
    const nav = pathname !== firstPath.current
    if (nav) {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
      firstPath.current = ""
      html.classList.remove("hari-intro-hold")
      html.classList.add("hari-intro", "hari-intro-nav")
    } else if (!html.classList.contains("hari-intro")) return
    const done = setTimeout(() => html.classList.remove("hari-intro", "hari-intro-nav"), nav ? 800 : 3500)
    return () => clearTimeout(done)
  }, [pathname])

  return (
    <div className={styles.intro} aria-hidden="true">
      {/* the two halves of a powder compact */}
      <div className={`${styles.lid} ${styles.lidTop}`} />
      <div className={`${styles.lid} ${styles.lidBottom}`} />
      <span className={styles.seam} />
      {/* first visit: a drop of serum, its ripples, the mark and the name written by hand */}
      <div className={styles.stage}>
        <span className={styles.drop} />
        {[0, 1, 2].map((r) => <span key={r} className={styles.ripple} style={{ ["--r" as string]: r }} />)}
        <span className={styles.mark}>
          {/* eslint-disable-next-line @next/next/no-img-element -- small static logo, must show at once */}
          <img src="/haristore-mark.png" alt="" />
        </span>
        <span className={`${styles.name} text-gold`}>Hari Store</span>
      </div>
      {/* while the next page loads: the mark breathes */}
      <span className={styles.pulse}>
        {/* eslint-disable-next-line @next/next/no-img-element -- small static logo, must show at once */}
        <img src="/haristore-mark.png" alt="" />
      </span>
    </div>
  )
}
