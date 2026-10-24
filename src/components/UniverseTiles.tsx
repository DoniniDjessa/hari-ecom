"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import type { UniverseCard } from "@/lib/types"
import { ArrowIcon } from "./icons"
import styles from "./UniverseTiles.module.css"

// Universes in two flexible rows (2 + the rest), as sngcompany's activities: on hover the tile widens,
// its content follows the pointer (depth), the details unfold and a bubble "Découvrir" follows the
// pointer over the grid. In the gold rings: the one round image chosen in the backoffice (Backoffice › Nos
// univers), else the initial of the universe. The first tile is black and gold.
// Phones: one swipeable row, every tile open.
export function UniverseTiles({ universes }: { universes: UniverseCard[] }) {
  const grid = useRef<HTMLDivElement>(null)
  const bubble = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState(0)

  // phones: the tile in the middle of the swipe row is the active one (dots under the row)
  useEffect(() => {
    if (!grid.current || !window.matchMedia("(max-width: 900px)").matches) return
    const tiles = [...grid.current.querySelectorAll<HTMLElement>("[data-tile]")]
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(Number((e.target as HTMLElement).dataset.tile))),
      { root: grid.current, threshold: 0.6 },
    )
    tiles.forEach((t) => observer.observe(t))
    return () => observer.disconnect()
  }, [])

  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !bubble.current || !grid.current) return
    const box = grid.current.getBoundingClientRect()
    bubble.current.style.transform = `translate(${e.clientX - box.left}px, ${e.clientY - box.top}px)`
  }
  const tilt = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== "mouse") return
    const box = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty("--mx", ((e.clientX - box.left) / box.width - 0.5).toFixed(3))
    e.currentTarget.style.setProperty("--my", ((e.clientY - box.top) / box.height - 0.5).toFixed(3))
  }
  const leave = (e: React.PointerEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.setProperty("--mx", "0")
    e.currentTarget.style.setProperty("--my", "0")
  }

  const rows = [universes.slice(0, 2), universes.slice(2)].filter((r) => r.length)

  return (
    <div className={styles.wrap}>
      <div ref={grid} className={styles.grid} onPointerMove={move}>
        {rows.map((row, r) => (
          <div key={r} className={styles.row}>
            {row.map((u, j) => {
              const i = r * 2 + j
              return (
                <Link
                  key={u.slug}
                  href={`/boutique?univers=${u.slug}`}
                  className={`${styles.tile} ${i === 0 ? styles.dark : ""}`}
                  data-tile={i}
                  style={{ ["--i" as string]: i, ["--grow" as string]: i === 0 ? 1.6 : 1 }}
                  onPointerMove={tilt}
                  onPointerLeave={leave}
                >
                  {/* gold rings + the fanned photos (or the initial) */}
                  <div className={styles.stage} aria-hidden="true">
                    <span className={styles.ring} />
                    <span className={`${styles.ring} ${styles.ring2}`} />
                    <span className={`${styles.ring} ${styles.ring3}`} />
                    {u.roundImage ? (
                      <span className={styles.round}>
                        <Image src={u.roundImage} alt="" fill sizes="(max-width: 900px) 70vw, 360px" />
                      </span>
                    ) : (
                      <span className={styles.initial}>{u.name[0]}</span>
                    )}
                  </div>

                  <div className={styles.top}>
                    <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={styles.count}>{u.count ? <><strong>{u.count}</strong> soins</> : "Bientôt"}</span>
                  </div>

                  <div className={styles.bottom}>
                    <p className={styles.tagline}>{u.tagline}</p>
                    <h3 className={styles.title}>{u.name}</h3>
                    <div className={styles.more}>
                      <div className={styles.moreInner}>
                        {u.forms.length > 0 && <ul>{u.forms.map((f) => <li key={f}>{f}</li>)}</ul>}
                        {u.productName && <p>À découvrir : {u.productName}</p>}
                      </div>
                    </div>
                    <span className={styles.go} aria-hidden="true"><ArrowIcon size={20} /></span>
                  </div>
                </Link>
              )
            })}
          </div>
        ))}
        <span ref={bubble} className={styles.bubble} aria-hidden="true"><span>Découvrir</span></span>
      </div>

      {/* phones: where we are in the swipe row */}
      <div className={styles.dots} aria-hidden="true">
        {universes.map((u, i) => <span key={u.slug} className={i === active ? styles.dotOn : ""} />)}
      </div>
    </div>
  )
}
