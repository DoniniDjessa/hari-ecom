"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react"
import type { SitePack } from "@/lib/types"
import { PackCard } from "./PackCard"
import styles from "./PacksRing.module.css"

// The packs on a 3D ring, always facing the camera: the pack in front is big and sharp, the others
// smaller, paler and blurred as they go round the back. The ring turns one step at a time, always the same
// way, by itself while on screen (paused under the mouse or a finger). Below it, a frieze of the packs' names slides to keep the front one in the middle, with a gold line
// filling until the next turn. Arrows, the names and swipe turn it; a
// click on a pack at the side brings it in front (the one in front works as a normal card).
// It never turns by itself with fewer than 3 packs or with reduced motion (then the steps jump).

const mod = (a: number, n: number) => ((a % n) + n) % n
const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2)

/** angle between two packs on the ring: a full ring for a few packs, an arc of ~40° each beyond */
const STEP = 0.7

/** where pack i stands when the ring is at `phase` (phase k: pack k in front); spread in px.
 *  compact (phones): the packs behind rise higher and lean, fanned out like a deck of cards, so their
 *  edges show above and beside the front one */
function place(i: number, phase: number, n: number, spread: number, still: boolean, compact = false): CSSProperties {
  if (n === 1) return { transform: "translateX(-50%)", zIndex: 100 }
  // steps from the front, the shortest way round (-n/2 … n/2): the packs far behind are hidden
  const d = mod(i - phase + n / 2, n) - n / 2
  const a = d * Math.min((Math.PI * 2) / n, STEP)
  const depth = (Math.cos(a) + 1) / 2 // 1 in front … 0 at the back
  const x = Math.sin(a) * spread * (n === 2 ? 0.75 : 1)
  const scale = 0.52 + 0.48 * Math.pow(depth, 1.3)
  // beyond ~110° from the front, a pack fades out (many packs: only ~3 on each side show)
  const fade = Math.min(1, Math.max(0, (2.2 - Math.abs(a)) / 0.5))
  // further from the front = higher (a lot on phones: the deck's edges show above the front pack)
  const rise = (Math.min(Math.abs(a), 2.2) / 2.2) * (compact ? 15 : 6)
  const lean = compact ? Math.sin(a) * 7 : 0
  return {
    transform: `translateX(-50%) translate(${x.toFixed(1)}px, ${(-rise).toFixed(2)}%) rotate(${lean.toFixed(2)}deg) scale(${scale.toFixed(4)})`,
    opacity: (compact ? 0.45 + 0.55 * Math.pow(depth, 1.2) : 0.2 + 0.8 * Math.pow(depth, 1.2)) * fade,
    visibility: fade > 0 ? "visible" : "hidden",
    filter: still || depth > 0.97 ? "none" : `blur(${((1 - depth) * 4).toFixed(2)}px)`,
    zIndex: Math.round(depth * 100),
  }
}

export function PacksRing({ packs, interval = 3600 }: { packs: SitePack[]; interval?: number }) {
  const n = packs.length
  // target: how many steps the ring has turned (never wraps: it always turns the same way)
  const [target, setTarget] = useState(0)
  const [visible, setVisible] = useState(false)
  const [paused, setPaused] = useState(false)
  const [still, setStill] = useState(false)
  const [spread, setSpread] = useState(380)
  const [compact, setCompact] = useState(false)
  const [height, setHeight] = useState<number | null>(null)
  const phase = useRef(0)
  const nodes = useRef<(HTMLDivElement | null)[]>([])
  const ref = useRef<HTMLDivElement>(null)
  const touch = useRef<number | null>(null)
  const front = mod(target, n)
  // the frieze is endless: name slot v shows pack v mod n, the track moves by whole slots with the ring.
  // While it slides, the slots between where it was and where it goes stay drawn.
  const [from, setFrom] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setFrom(target), 950)
    return () => clearTimeout(t)
  }, [target])
  const slots: number[] = []
  for (let v = Math.min(from, target) - 4; v <= Math.max(from, target) + 4; v++) slots.push(v)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setStill(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  // turns only while on screen
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // the ring's width (how far the side packs go) and height (the tallest card)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      const card = nodes.current[0]?.offsetWidth ?? 360
      // phones: no room on the sides, the packs behind fan out close and rise above the front one
      const small = w < 640
      setCompact(small)
      setSpread(small ? card * 0.5 : Math.max(card * 0.62, Math.min(w / 2 - card * 0.18, card * 1.15)))
      setHeight(Math.max(...nodes.current.map((c) => c?.offsetHeight ?? 0)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    nodes.current.forEach((c) => c && ro.observe(c))
    return () => ro.disconnect()
  }, [n])

  const layout = useCallback(() => {
    nodes.current.forEach((el, i) => {
      if (el) Object.assign(el.style, place(i, phase.current, n, spread, still, compact))
    })
  }, [n, spread, still, compact])
  useLayoutEffect(layout, [layout])

  // the turn: eased from where the ring is to the target step
  useEffect(() => {
    const from = phase.current
    if (from === target) return
    const duration = still ? 0 : 1100
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const k = duration ? Math.min(1, (now - start) / duration) : 1
      phase.current = from + (target - from) * ease(k)
      layout()
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, still, layout])

  // turning by itself now: the gold line fills until the next turn
  const running = n >= 3 && visible && !paused && !still
  useEffect(() => {
    if (!running) return
    const t = setTimeout(() => setTarget((s) => s + 1), interval)
    return () => clearTimeout(t)
  }, [target, running, interval])

  /** brings pack i in front, the shortest way round */
  const go = (i: number) => {
    let d = mod(i - front, n)
    if (d > n / 2) d -= n
    if (d) setTarget((s) => s + d)
  }

  return (
    <div className={styles.wrap}>
      <div
        ref={ref}
        className={styles.ring}
        style={{ height: (height ?? 540) + (compact ? 96 : 24) }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(e) => { touch.current = e.touches[0].clientX; setPaused(true) }}
        onTouchEnd={(e) => {
          const start = touch.current
          touch.current = null
          setPaused(false)
          if (start == null) return
          const dx = e.changedTouches[0].clientX - start
          if (Math.abs(dx) > 40) setTarget((s) => s + (dx < 0 ? 1 : -1))
        }}
        aria-roledescription="carrousel"
        aria-label="Nos packs"
      >
        {packs.map((p, i) => (
          <div
            key={p.id}
            ref={(el) => { nodes.current[i] = el }}
            className={`${styles.slide} ${i === front ? styles.front : styles.side}`}
            style={place(i, phase.current, n, spread, still, compact)}
            aria-hidden={i !== front}
            // a pack at the side: the click brings it in front instead of opening it
            onClickCapture={i !== front ? (e) => { e.preventDefault(); e.stopPropagation(); go(i) } : undefined}
          >
            <PackCard pack={p} />
          </div>
        ))}
      </div>

      {n > 1 && (
        <div className={styles.controls}>
          <div className={styles.navRow}>
            <button type="button" className={styles.arrow} aria-label="Pack précédent" onClick={() => setTarget((s) => s - 1)}>‹</button>
            <span className={styles.counter} aria-live="polite">
              <strong>{String(front + 1).padStart(2, "0")}</strong><span>/</span>{String(n).padStart(2, "0")}
            </span>
            <button type="button" className={styles.arrow} aria-label="Pack suivant" onClick={() => setTarget((s) => s + 1)}>›</button>
          </div>

          {/* the frieze of names: the front one in gold in the middle, its neighbours fading away */}
          <div className={styles.frieze}>
            <div className={styles.track} role="tablist" aria-label="Choisir un pack"
              style={{ transform: `translateX(calc(${-target} * var(--slot)))` }}>
              {slots.map((v) => {
                const i = mod(v, n)
                const far = Math.abs(v - target)
                return (
                  <button key={v} type="button" role="tab" aria-selected={v === target} title={packs[i].name}
                    tabIndex={far <= 2 ? 0 : -1}
                    className={`${styles.name} ${far === 0 ? styles.on : far === 1 ? styles.near : ""}`}
                    style={{ left: `calc(50% + ${v} * var(--slot) - var(--name) / 2)` }}
                    onClick={() => setTarget(v)}>
                    {packs[i].name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* time until the next turn */}
          <div className={styles.progress} aria-hidden>
            {running && <span key={target} className={styles.fill} style={{ animationDuration: `${interval}ms` }} />}
          </div>
        </div>
      )}
    </div>
  )
}
