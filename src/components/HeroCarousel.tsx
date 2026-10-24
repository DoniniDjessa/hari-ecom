"use client"

import Link from "next/link"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowIcon, ChevronIcon } from "./icons"
import styles from "./HeroCarousel.module.css"

export type HeroSlide = {
  eyebrow: string
  title: string
  subtitle?: string
  text: string
  image: string | null
  link: string
  cta: string
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
      className={`${styles.hero} ${posters ? styles.posters : ""}`}
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
                  <Image src={s.poster.image} alt={s.title} fill priority={i === 0} sizes="100vw" className={`${styles.posterImg} ${s.poster.mobile ? styles.desktopOnly : ""}`} />
                  {s.poster.mobile && (
                    <Image src={s.poster.mobile} alt={s.title} fill priority={i === 0} sizes="100vw" className={`${styles.posterImg} ${styles.mobileOnly}`} />
                  )}
                </div>
                {s.poster.brandText ? (
                  <>
                    <div className={styles.posterShade} />
                    <Text s={s} active={i === index} className={styles.posterText} />
                  </>
                ) : s.poster.link && (
                  <Link href={s.poster.link} className={styles.posterLink} tabIndex={i === index ? 0 : -1} aria-label={s.poster.label || s.title}>
                    {s.poster.label && <span className={styles.posterCta}>{s.poster.label} <ArrowIcon size={18} /></span>}
                  </Link>
                )}
              </>
            ) : (<>
            <div className={styles.media}>
              {s.image ? (
                <Image src={s.image} alt={s.subtitle || s.title} fill priority={i === 0} sizes="(max-width: 768px) 100vw, 60vw" className={styles.img} />
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
                  aria-label={`Diapositive ${i + 1} : ${s.title}`}
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

/** The texts of a slide: eyebrow, title rising line by line, text, buttons */
function Text({ s, active, className = "" }: { s: HeroSlide; active: boolean; className?: string }) {
  return (
    <div className={`${styles.content} ${className}`}>
      {s.script ? (
        <p className={`${styles.eyebrow} ${styles.eyebrowScript}`}><span className="script text-gold">{s.eyebrow}</span></p>
      ) : (
        <p className={styles.eyebrow}><span />{s.eyebrow}</p>
      )}
      <h2 className={styles.title}>
        <span className={styles.line}><span>{s.title}</span></span>
        {s.subtitle && <span className={`${styles.line} ${styles.muted}`}><span>{s.subtitle}</span></span>}
      </h2>
      {s.text && <p className={styles.text}>{s.text}</p>}
      <div className={styles.actions}>
        <Link href={s.link} className={styles.cta} tabIndex={active ? 0 : -1}>{s.cta} <ArrowIcon size={18} /></Link>
        <Link href="/boutique" className={styles.ghost} tabIndex={active ? 0 : -1}>Toute la boutique</Link>
      </div>
    </div>
  )
}
