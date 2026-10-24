"use client"

import { useEffect, useState } from "react"
import styles from "./ThemeToggle.module.css"

type Theme = "light" | "dark"

/** Light / dark switch: saved in the browser (the inline script of app/layout.tsx applies it before paint).
 *  `labelled`: shows "Mode sombre" / "Mode clair" beside the switch (side menu). */
export function ThemeToggle({ labelled = false }: { labelled?: boolean }) {
  const [theme, setTheme] = useState<Theme>("light")

  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light")
  }, [])

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark"
    const html = document.documentElement
    html.classList.add("theme-switch")
    html.setAttribute("data-theme", next)
    try {
      localStorage.setItem("hari-theme", next)
    } catch {}
    setTheme(next)
    setTimeout(() => html.classList.remove("theme-switch"), 600)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`${styles.toggle} ${labelled ? styles.labelled : ""}`}
      aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
      aria-pressed={theme === "dark"}
    >
      <span className={`${styles.track} ${theme === "dark" ? styles.on : ""}`}>
        <span className={styles.knob}>
          {theme === "dark" ? (
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          )}
        </span>
      </span>
      {labelled && <span>{theme === "dark" ? "Mode sombre" : "Mode clair"}</span>}
    </button>
  )
}
