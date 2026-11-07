"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import type { UniverseCard } from "@/lib/types"
import { ArrowIcon } from "./icons"
import styles from "./UniverseTiles.module.css"

// Universes as arches, like the windows of a boutique: the round image chosen in the backoffice
// (Backoffice › Nos univers) fills the arch, else a product photo on its studio background, else the
// initial. A double gold line frames the inside. At the bottom: number, name, the tagline in calligraphy,
// the count. On hover the photo zooms in slowly, the gold frame tightens, the product types and a
// "Découvrir" pill rise. Phones: one swipeable row of arches, dots under it.
export function UniverseTiles({ universes }: { universes: UniverseCard[] }) {
  const row = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  // phones: the arch in the middle of the swipe row is the active one (dots under the row)
  useEffect(() => {
    if (!row.current || !window.matchMedia("(max-width: 900px)").matches) return
    const arches = [...row.current.querySelectorAll<HTMLElement>("[data-arch]")]
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(Number((e.target as HTMLElement).dataset.arch))),
      { root: row.current, threshold: 0.6 },
    )
    arches.forEach((a) => observer.observe(a))
    return () => observer.disconnect()
  }, [])

  return (
    <div className={styles.wrap}>
      <div ref={row} className={styles.grid}>
        {universes.map((u, i) => {
          // the photo of the arch: the backoffice's round image (cover), else a product photo (contain)
          const photo = u.roundImage ?? u.image
          return (
            <Link
              key={u.slug}
              href={`/boutique?univers=${u.slug}`}
              className={`${styles.arch} ${u.roundImage ? "" : styles.plain}`}
              data-arch={i}
              style={{ ["--i" as string]: i }}
            >
              <span className={styles.media} aria-hidden="true">
                {photo ? (
                  <Image
                    src={photo}
                    alt=""
                    fill
                    sizes="(max-width: 900px) 75vw, 400px"
                    className={u.roundImage ? styles.cover : styles.contain}
                  />
                ) : (
                  <span className={styles.initial}>{u.name[0]}</span>
                )}
              </span>
              <span className={styles.frame} aria-hidden="true" />

              <span className={styles.count}>{u.count ? <><strong>{u.count}</strong> soins</> : "Bientôt"}</span>

              <div className={styles.body}>
                <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
                <span className={`script ${styles.tagline}`}>{u.tagline}</span>
                <h3 className={styles.title}>{u.name}</h3>
                <div className={styles.more}>
                  <div className={styles.moreInner}>
                    {u.forms.length > 0 && (
                      <span className={styles.forms}>{u.forms.map((f) => <span key={f}>{f}</span>)}</span>
                    )}
                    <span className={styles.go}>Découvrir <ArrowIcon size={16} /></span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* phones: where we are in the swipe row */}
      <div className={styles.dots} aria-hidden="true">
        {universes.map((u, i) => <span key={u.slug} className={i === active ? styles.dotOn : ""} />)}
      </div>
    </div>
  )
}
