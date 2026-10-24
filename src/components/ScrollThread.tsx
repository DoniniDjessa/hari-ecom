"use client"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import styles from "./ScrollThread.module.css"

type Mark = { id: string; label: string; at: number }

// The thread of the page (after sngcompany's road): a thin gold line fixed on the left fills as you scroll,
// a drop of serum runs down it with you and lights up each "station" it passes. Stations are the sections
// marked with data-station="Label", placed at their position in the page; a click on one goes there.
// Rendered once by the site layout: it follows every page. Small screens: a bar across the top.
export function ScrollThread() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [marks, setMarks] = useState<Mark[]>([])
  const [visible, setVisible] = useState(false)
  const frame = useRef(0)

  useEffect(() => {
    const measure = () => {
      frame.current = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const y = window.scrollY
      setProgress(max > 0 ? Math.min(1, y / max) : 0)
      setVisible(y > window.innerHeight * 0.55)
      const sections = [...document.querySelectorAll<HTMLElement>("[data-station]")]
      setMarks(
        max <= 0
          ? []
          : sections.map((el, i) => {
              if (!el.id) el.id = `etape-${i + 1}`
              // the section counts as reached when its top passes the middle of the screen
              const top = el.getBoundingClientRect().top + y - window.innerHeight / 2
              return { id: el.id, label: el.dataset.station ?? "", at: Math.min(1, Math.max(0, top / max)) }
            }),
      )
    }
    const schedule = () => { if (!frame.current) frame.current = requestAnimationFrame(measure) }
    schedule()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      cancelAnimationFrame(frame.current)
      frame.current = 0 // a later run of the effect (strict mode, new page) must be able to schedule again
    }
  }, [pathname])

  // section the reader is in: the last station already passed
  const current = [...marks].reverse().find((m) => progress >= m.at - 0.002)
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })

  return (
    <>
      <div className={`${styles.mobileBar} ${visible ? styles.visible : ""}`} aria-hidden="true">
        <span key={current?.id} className={styles.mobileLabel}>{current?.label ?? ""}</span>
        <span className={styles.mobileTrack}>
          <span className={styles.mobileFill} style={{ transform: `scaleX(${progress})` }} />
          <span className={styles.mobileDrop} style={{ left: `${progress * 100}%` }} />
        </span>
      </div>
      <aside className={`${styles.thread} ${visible ? styles.visible : ""}`} aria-label="Sections de la page">
        <div className={styles.track}>
          <div className={styles.fill} style={{ transform: `scaleY(${progress})` }} />
          {marks.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`${styles.station} ${progress >= m.at - 0.002 ? styles.passed : ""} ${current?.id === m.id ? styles.current : ""}`}
              style={{ top: `${m.at * 100}%` }}
              onClick={() => go(m.id)}
            >
              <span className={styles.stationDot} />
              <span className={styles.stationLabel}>{m.label}</span>
            </button>
          ))}
          <span className={styles.drop} style={{ top: `${progress * 100}%` }} aria-hidden="true">
            <span className={styles.dropBody} />
          </span>
        </div>
      </aside>
    </>
  )
}
