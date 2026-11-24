"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react"
import type { SitePack } from "@/lib/types"
import { PackCard } from "./PackCard"
import { ChevronIcon } from "./icons"
import styles from "./PacksRing.module.css"

// The packs on a 3D ring, always facing the camera: the pack in front is big and sharp, the others
// smaller, paler and blurred as they go round the back. It never turns by itself: the arrows, the frieze of
// the packs' names below (it slides to keep the front one in the middle), a swipe or a click on a pack at
// the side turn it (the one in front works as a normal card). With reduced motion the steps jump.

const mod = (a: number, n: number) => ((a % n) + n) % n
const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2)

/** angle between two packs on the ring: a full ring for a few packs, an arc of ~40° each beyond */
const STEP = 0.7

/** how far (px) each step behind peeks out past the front pack on phones */
const PEEK = 64

/** where pack i stands when the ring is at `phase` (phase k: pack k in front); spread in px.
 *  compact (phones): the ring stands up — the front pack takes the screen's width, the previous packs
 *  peek out above it, the next ones wait hidden behind; spread is then the cards' height */
function place(i: number, phase: number, n: number, spread: number, still: boolean, compact = false): CSSProperties {
  if (n === 1) return { transform: "translateX(-50%)", zIndex: 100 }
  // steps from the front, the shortest way round (-n/2 … n/2): the packs far behind are hidden
  const d = mod(i - phase + n / 2, n) - n / 2
  const a = d * Math.min((Math.PI * 2) / n, STEP)
  const depth = (Math.cos(a) + 1) / 2 // 1 in front … 0 at the back
  const scale = compact ? 0.8 + 0.2 * Math.pow(depth, 2) : 0.52 + 0.48 * Math.pow(depth, 1.3)
  // beyond ~110° from the front, a pack fades out (many packs: only ~3 on each side show)
  const fade = Math.min(1, Math.max(0, (2.2 - Math.abs(a)) / 0.5))
  if (compact) {
    // the previous packs peek out above: just enough to clear the shrink, then PEEK px more per step.
    // The next ones stay hidden behind: while turning, the incoming one rises from a little below, fading in
    const steps = Math.min(Math.abs(a), 2.2) / STEP
    const above = a <= 0
    const y = above ? -((spread * (1 - scale)) / 2 + PEEK * Math.min(steps, 2)) : steps * 40
    const show = above ? fade : Math.max(0, 1 - steps / 0.6)
    return {
      transform: `translateX(-50%) translateY(${y.toFixed(1)}px) scale(${scale.toFixed(4)})`,
      opacity: (0.45 + 0.55 * Math.pow(depth, 1.5)) * show,
      visibility: show > 0 ? "visible" : "hidden",
      filter: still || depth > 0.97 ? "none" : `blur(${((1 - depth) * 3).toFixed(2)}px)`,
      zIndex: Math.round(depth * 100),
    }
  }
  const x = Math.sin(a) * spread * (n === 2 ? 0.75 : 1)
  // further from the front = a little higher
  const rise = (Math.min(Math.abs(a), 2.2) / 2.2) * 6
  return {
    transform: `translateX(-50%) translate(${x.toFixed(1)}px, ${(-rise).toFixed(2)}%) scale(${scale.toFixed(4)})`,
    opacity: (compact ? 0.35 + 0.65 * Math.pow(depth, 1.5) : 0.2 + 0.8 * Math.pow(depth, 1.2)) * fade,
    visibility: fade > 0 ? "visible" : "hidden",
    filter: still || depth > 0.97 ? "none" : `blur(${((1 - depth) * 4).toFixed(2)}px)`,
    zIndex: Math.round(depth * 100),
  }
}

export function PacksRing({ packs }: { packs: SitePack[] }) {
  const n = packs.length
  // target: how many steps the ring has turned (never wraps: it always turns the same way)
  const [target, setTarget] = useState(0)
  const [still, setStill] = useState(false)
  const [spread, setSpread] = useState(380)
  const [compact, setCompact] = useState(false)
  const [height, setHeight] = useState<number | null>(null)
  const phase = useRef(0)
  const nodes = useRef<(HTMLDivElement | null)[]>([])
  const ref = useRef<HTMLDivElement>(null)
  const touch = useRef<{ x: number; y: number; photo: boolean } | null>(null)
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

  // the ring's width (how far the side packs go) and height (the tallest card)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      const card = nodes.current[0]?.offsetWidth ?? 360
      const tall = Math.max(...nodes.current.map((c) => c?.offsetHeight ?? 0))
      // phones: no room on the sides, the packs behind peek out above and below the front one
      const small = w < 640
      setCompact(small)
      setSpread(small ? tall : Math.max(card * 0.62, Math.min(w / 2 - card * 0.18, card * 1.15)))
      setHeight(tall)
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
        style={{ height: (height ?? 540) + (compact ? PEEK * 2 + 60 : 24) }}
        onTouchStart={(e) => {
          const t = e.touches[0]
          // on phones, a swipe that starts on a photo may go up or down (the page doesn't scroll there)
          const photo = compact && !!(e.target as HTMLElement).closest?.("[data-pack-photo]")
          touch.current = { x: t.clientX, y: t.clientY, photo }
        }}
        onTouchEnd={(e) => {
          const start = touch.current
          touch.current = null
          if (start == null) return
          const t = e.changedTouches[0]
          const dx = t.clientX - start.x
          const dy = t.clientY - start.y
          if (Math.abs(dx) > 40 && Math.abs(dx) >= Math.abs(dy)) { setTarget((s) => s + (dx < 0 ? 1 : -1)); return }
          // up: the next pack (it comes from below), down: the previous one (from above)
          if (start.photo && Math.abs(dy) > 40) { e.preventDefault(); setTarget((s) => s + (dy < 0 ? 1 : -1)); return }
          // a tap on the edge of a pack behind: the browser's touch adjustment would move the click onto
          // the front card's nearby buttons, so the pack under the finger is found here, at the exact point
          if (Math.abs(dx) > 10 || Math.abs(t.clientY - start.y) > 10) return
          const slide = document.elementFromPoint(t.clientX, t.clientY)?.closest<HTMLElement>("[data-pack]")
          const i = slide ? Number(slide.dataset.pack) : front
          if (i !== front) { e.preventDefault(); go(i) }
        }}
        aria-roledescription="carrousel"
        aria-label="Nos packs"
      >
        {packs.map((p, i) => (
          <div
            key={p.id}
            data-pack={i}
            ref={(el) => { nodes.current[i] = el }}
            className={`${styles.slide} ${i === front ? styles.front : styles.side}`}
            style={place(i, phase.current, n, spread, still, compact)}
            aria-hidden={i !== front}
            // a pack at the side: the click brings it in front instead of opening it
            onClickCapture={i !== front ? (e) => { e.preventDefault(); e.stopPropagation(); go(i) } : undefined}
          >
            <PackCard pack={p} list={false} />
          </div>
        ))}
        {/* phones: a small arrow at each end of the stack, over the packs behind */}
        {compact && n > 1 && (
          <>
            <button type="button" className={`${styles.edge} ${styles.edgeUp}`} aria-label="Pack précédent" onClick={() => setTarget((s) => s - 1)}>
              <ChevronIcon size={18} />
            </button>
            <button type="button" className={`${styles.edge} ${styles.edgeDown}`} aria-label="Pack suivant" onClick={() => setTarget((s) => s + 1)}>
              <ChevronIcon size={18} />
            </button>
          </>
        )}
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
        </div>
      )}
    </div>
  )
}
