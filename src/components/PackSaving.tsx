"use client"

import { useEffect, useRef, useState } from "react"
import { Price } from "./Price"
import styles from "./PackSaving.module.css"

// What the pack is worth against its price, felt at a glance: "bought separately 55 000 F" struck through,
// "the pack 45 000 F", and a bar the length of the products' value that shrinks to the pack price when it
// comes on screen, the part freed turning into gold stripes (-18 %); then "Vous économisez 10 000 F",
// the amount counting up. Nothing shown when the pack costs no less than its products.

export function PackSaving({ value, price, large = false }: { value: number; price: number; large?: boolean }) {
  const saving = value - price
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  const [counted, setCounted] = useState(0)

  // starts once on screen
  useEffect(() => {
    const el = ref.current
    if (!el || saving <= 0) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); io.disconnect() }
    }, { threshold: 0.6 })
    io.observe(el)
    return () => io.disconnect()
  }, [saving])

  // the saving counts up while the bar shrinks (at once with reduced motion)
  useEffect(() => {
    if (!shown) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setCounted(saving); return }
    const start = performance.now()
    const duration = 1200
    let raf = 0
    const tick = (now: number) => {
      const k = Math.min(1, (now - start - 250) / duration)
      setCounted(k <= 0 ? 0 : Math.round(saving * (1 - Math.pow(1 - k, 3)) / 50) * 50)
      if (k < 1) raf = requestAnimationFrame(tick)
      else setCounted(saving)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [shown, saving])

  if (saving <= 0 || value <= 0) return null
  const pct = Math.round((saving / value) * 100)
  const share = (price / value) * 100

  return (
    <div ref={ref} className={`${styles.box} ${large ? styles.large : ""} ${shown ? styles.shown : ""}`}>
      <div className={styles.rows}>
        <p className={styles.row}>
          <span>Acheté séparément</span>
          <s><Price amount={value} /></s>
        </p>
        <p className={`${styles.row} ${styles.pack}`}>
          <span>Le pack</span>
          <strong><Price amount={price} /></strong>
        </p>
      </div>

      {/* the products' value; the pack price fills it, the rest is what the client keeps */}
      <div className={styles.bar} aria-hidden style={{ ["--share" as string]: `${share}%` }}>
        <span className={styles.paid} />
        <span className={styles.kept}><em>-{pct} %</em></span>
      </div>

      <p className={styles.saved}>
        Vous économisez <strong><Price amount={shown ? counted : 0} /></strong>
      </p>
    </div>
  )
}
