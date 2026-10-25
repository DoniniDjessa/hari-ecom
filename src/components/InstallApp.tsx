"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import styles from "./InstallApp.module.css"

// "Installer l'application": registers the service worker (production), then offers the install once the
// visitor knows the site (2nd visit, after 25 s). Android / Chrome: the browser's own prompt; iPhone:
// how to do it in Safari. "Plus tard" hides it for 2 weeks; never shown inside the installed app.
type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

const VISITS = "hari-visits"
const LATER = "hari-install-later"

export function InstallApp() {
  const [prompt, setPrompt] = useState<PromptEvent | null>(null)
  const [ios, setIos] = useState(false)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }
    const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone
    if (standalone) return
    // one visit = one browser session
    let visits = 1
    try {
      visits = Number(localStorage.getItem(VISITS) || 0)
      if (!sessionStorage.getItem("hari-counted")) {
        visits += 1
        localStorage.setItem(VISITS, String(visits))
        sessionStorage.setItem("hari-counted", "1")
      }
      if (Number(localStorage.getItem(LATER) || 0) > Date.now()) return
    } catch {}
    if (visits < 2) return

    const onPrompt = (e: Event) => { e.preventDefault(); setPrompt(e as PromptEvent) }
    window.addEventListener("beforeinstallprompt", onPrompt)
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent)
    setIos(isIos)
    const t = setTimeout(() => setShow(true), 25_000)
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); clearTimeout(t) }
  }, [])

  if (!show || (!prompt && !ios)) return null

  const later = () => {
    setShow(false)
    try { localStorage.setItem(LATER, String(Date.now() + 14 * 86_400_000)) } catch {}
  }
  const install = async () => {
    if (!prompt) return
    await prompt.prompt()
    await prompt.userChoice.catch(() => null)
    setShow(false)
  }

  return (
    <div className={styles.card} role="dialog" aria-label="Installer l'application">
      <Image src="/icons/icon-192.png" alt="" width={48} height={48} className={styles.icon} />
      <div className={styles.text}>
        <strong>Hari Store sur votre écran d&apos;accueil</strong>
        {prompt ? (
          <span>Ouvrez la boutique en un geste, comme une application.</span>
        ) : (
          <span>Dans Safari, touchez <b>Partager</b> puis <b>Sur l&apos;écran d&apos;accueil</b>.</span>
        )}
      </div>
      <div className={styles.actions}>
        {prompt && <button type="button" className={styles.install} onClick={install}>Installer</button>}
        <button type="button" className={styles.later} onClick={later}>Plus tard</button>
      </div>
    </div>
  )
}
