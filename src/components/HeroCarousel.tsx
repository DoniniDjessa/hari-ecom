"use client"

import Link from "next/link"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowIcon, ChevronIcon } from "./icons"
import type { Show, ShowKey, Shows } from "@/lib/content"
import styles from "./HeroCarousel.module.css"

export type HeroSlide = {
  eyebrow: string
  title: string
  subtitle?: string
  text: string
  image: string | null
  link: string
  cta: string
  /** name of the slide (dots, image alt) when the title is left empty */
  label?: string
  /** on which screens each text and the button are shown (backoffice); missing: everywhere */
  show?: Shows
  /** the eyebrow in handwriting and real gold (brand slide) */
  script?: boolean
  /** a poster made outside (backoffice): shown whole, its own text included */
  poster?: { image: string; mobile: string; link: string; label: string; brandText: boolean }
}

const DURATION = 5000 // ms per slide

// Full-width hero carousel (sngcompany's, in light): the incoming slide is uncovered like a curtain (from
// below going forward, from above going back), its product photo settles from a zoom, then the text rises
// line by line. Vertical dots on the right double as progress bars (gold): when the active bar is full,
// the next slide comes. A gold spark runs along a thread at the top while the slide plays.
// Posters (backoffice): each slide is a poster made outside, shown whole at its own ratio (32:15 on a
// computer, 4:5 on a phone with the phone version); the whole poster leads to its link. With "brand text"
// on (backoffice), the texts of the brand slide rise over the poster, on a soft ivory veil, and its button
// leads to the link instead.
export function HeroCarousel({ slides, next = "univers" }: { slides: HeroSlide[]; next?: string }) {
  const posters = slides.some((s) => s.poster)
  const [index, setIndex] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const count = slides.length

  const go = useCallback(
    (to: number) => {
      const n = (to + count) % count
      if (count < 2 || n === index) return
      setPrev(index)
      setIndex(n)
    },
    [count, index],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (window.scrollY > window.innerHeight * 0.6) return
      if (e.key === "ArrowRight") go(index + 1)
      if (e.key === "ArrowLeft") go(index - 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go, index])

  if (count === 0) return null

  return (
    <section
      className={`${styles.hero} ${posters ? styles.posters : ""} ${paused ? styles.paused : ""}`}
      aria-roledescription="carrousel"
      aria-label="À la une"
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        if (!touch.current) return
        const dx = e.changedTouches[0].clientX - touch.current.x
        const dy = e.changedTouches[0].clientY - touch.current.y
        touch.current = null
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1))
      }}
    >
      {slides.map((s, i) => {
        const state = i === index ? styles.active : i === prev ? styles.previous : i < index ? styles.before : ""
        return (
          <div key={i} className={`${styles.slide} ${state}`} role="group" aria-roledescription="diapositive" aria-label={`${i + 1} sur ${count}`} aria-hidden={i !== index}>
            {s.poster ? (
              <>
                <div className={styles.posterMedia}>
                  <Image src={s.poster.image} alt={nameOf(s)} fill priority={i === 0} sizes="100vw" className={`${styles.posterImg} ${s.poster.mobile ? styles.desktopOnly : ""}`} />
                  {s.poster.mobile && (
                    <Image src={s.poster.mobile} alt={nameOf(s)} fill priority={i === 0} sizes="100vw" className={`${styles.posterImg} ${styles.mobileOnly}`} />
                  )}
                </div>
                {s.poster.brandText && hasText(s) ? (
                  <>
                    {/* the ivory veil only behind texts (a button alone sits on the bare poster) */}
                    {seenOn(s, ["eyebrow", "title", "subtitle", "text"]) && (
                      <div className={`${styles.posterShade} ${on(seenOn(s, ["eyebrow", "title", "subtitle", "text"]))}`} />
                    )}
                    <Text s={s} active={i === index} className={styles.posterText} />
                    {/* where the button is not seen: the whole poster still leads to its link */}
                    {s.poster.link && elsewhere(seenOn(s, ["button"])) && (
                      <Link href={s.poster.link} className={`${styles.posterLink} ${on(elsewhere(seenOn(s, ["button"])))}`} tabIndex={i === index ? 0 : -1} aria-label={nameOf(s)} />
                    )}
                  </>
                ) : s.poster.link && (
                  <Link href={s.poster.link} className={styles.posterLink} tabIndex={i === index ? 0 : -1} aria-label={nameOf(s)}>
                    {s.cta && <span className={`${styles.posterCta} ${on(showOf(s, "button"))}`}>{s.cta} <ArrowIcon size={18} /></span>}
                  </Link>
                )}
              </>
            ) : (<>
            <div className={styles.media}>
              {s.image ? (
                <Image src={s.image} alt={s.subtitle || nameOf(s)} fill priority={i === 0} sizes="(max-width: 768px) 100vw, 60vw" className={styles.img} />
              ) : (
                <Image src="/haristore-mark.png" alt="" width={520} height={330} priority={i === 0} className={styles.mark} />
              )}
            </div>
            <div className={styles.shade} />
            <Text s={s} active={i === index} />
            </>)}
          </div>
        )
      })}

      {/* top: a gold spark runs along the thread while the active slide plays */}
      {count > 1 && (
        <div className={styles.road} aria-hidden="true" style={{ ["--d" as string]: `${DURATION}ms` }}>
          <span className={styles.roadLabel}>{String(index + 1).padStart(2, "0")}</span>
          <span className={styles.track}>
            <span key={index} className={styles.trail} />
            <span key={`s-${index}`} className={styles.runner} />
          </span>
          <span className={styles.roadLabel}>{String(((index + 1) % count) + 1).padStart(2, "0")}</span>
        </div>
      )}

      {count > 1 && (
        <nav className={styles.nav} aria-label="Diapositives">
          {/* pause: the progress stops where it is, to read the slide at ease */}
          <button type="button" className={styles.pause} onClick={() => setPaused((p) => !p)} aria-pressed={paused} aria-label={paused ? "Reprendre le défilement" : "Mettre en pause"} title={paused ? "Reprendre" : "Pause"}>
            {paused ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4.5" width="4" height="15" rx="1" /><rect x="14" y="4.5" width="4" height="15" rx="1" /></svg>
            )}
          </button>
          <span className={styles.counter} aria-hidden="true">
            <strong key={index}>{String(index + 1).padStart(2, "0")}</strong>
            <small>{String(count).padStart(2, "0")}</small>
          </span>
          <ol className={styles.dots}>
            {slides.map((s, i) => (
              <li key={i}>
                <button
                  className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
                  onClick={() => go(i)}
                  aria-label={`Diapositive ${i + 1} : ${nameOf(s)}`}
                  aria-current={i === index}
                >
                  {i === index && <span key={index} className={styles.fill} style={{ animationDuration: `${DURATION}ms` }} onAnimationEnd={() => go(index + 1)} />}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <a href={`#${next}`} className={`${styles.scroll} ${posters ? styles.scrollHidden : ""}`} aria-label="Faire défiler">
        <span>Défiler</span>
        <ChevronIcon size={16} className={styles.down} />
      </a>
    </section>
  )
}

/** a slide with at least one text to show (all left empty in the backoffice: the image alone) */
const hasText = (s: HeroSlide) => Boolean(s.eyebrow || s.title || s.subtitle || s.text || s.cta)
const nameOf = (s: HeroSlide) => s.title || s.label || s.subtitle || "Hari Store"

/** the class that keeps an element to a computer or to a phone (backoffice) */
const on = (show: Show | null | undefined) => (show === "desktop" ? styles.onlyDesktop : show === "mobile" ? styles.onlyMobile : "")
const showOf = (s: HeroSlide, k: ShowKey): Show => s.show?.[k] ?? "all"
/** where at least one of these elements (when filled) is seen: null when none is filled */
function seenOn(s: HeroSlide, keys: ShowKey[]): Show | null {
  const value = { eyebrow: s.eyebrow, title: s.title, subtitle: s.subtitle, text: s.text, button: s.cta }
  const shows = keys.filter((k) => value[k]).map((k) => showOf(s, k))
  if (!shows.length) return null
  return shows.every((x) => x === shows[0]) ? shows[0] : "all"
}
/** the other screens than these (where a button is not seen, the whole poster is the link) */
const elsewhere = (show: Show | null): Show | null => (show === null ? "all" : show === "desktop" ? "mobile" : show === "mobile" ? "desktop" : null)

/** The texts of a slide: eyebrow, title rising line by line, text, buttons. A text left empty in the
 *  backoffice is left out (no button text: no buttons). */
function Text({ s, active, className = "" }: { s: HeroSlide; active: boolean; className?: string }) {
  return (
    <div className={`${styles.content} ${className} ${on(seenOn(s, ["eyebrow", "title", "subtitle", "text", "button"]))}`}>
      {s.eyebrow && (s.script ? (
        <p className={`${styles.eyebrow} ${styles.eyebrowScript} ${on(showOf(s, "eyebrow"))}`}><span className="script text-gold">{s.eyebrow}</span></p>
      ) : (
        <p className={`${styles.eyebrow} ${on(showOf(s, "eyebrow"))}`}><span />{s.eyebrow}</p>
      ))}
      {(s.title || s.subtitle) && (
        <h2 className={`${styles.title} ${on(seenOn(s, ["title", "subtitle"]))}`}>
          {s.title && <span className={`${styles.line} ${on(showOf(s, "title"))}`}><span>{s.title}</span></span>}
          {s.subtitle && <span className={`${styles.line} ${styles.muted} ${on(showOf(s, "subtitle"))}`}><span>{s.subtitle}</span></span>}
        </h2>
      )}
      {s.text && <p className={`${styles.text} ${on(showOf(s, "text"))}`}>{s.text}</p>}
      {s.cta && (
        <div className={`${styles.actions} ${on(showOf(s, "button"))}`}>
          <Link href={s.link} className={styles.cta} tabIndex={active ? 0 : -1}>{s.cta} <ArrowIcon size={18} /></Link>
          <Link href="/boutique" className={styles.ghost} tabIndex={active ? 0 : -1}>Toute la boutique</Link>
        </div>
      )}
    </div>
  )
}
