"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import styles from "./InstallApp.module.css"

// "Installer l'application": registers the service worker (production), then offers the install at the
// bottom of the screen for 4 s when the site loads, at most once a day. Android / Chrome: the browser's
// own prompt; iPhone: how to do it in Safari. "Plus tard" hides it for 2 weeks; never shown inside the
// installed app. Touching or hovering the card keeps it open.
type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

const SHOWN = "hari-install-shown"
const LATER = "hari-install-later"
const DAY = 86_400_000
const VISIBLE = 4_000

export function InstallApp() {
  const [prompt, setPrompt] = useState<PromptEvent | null>(null)
  const [ios, setIos] = useState(false)
  const [show, setShow] = useState(false)
  const hide = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }
    const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone
    if (standalone) return
    try {
      const now = Date.now()
      if (Number(localStorage.getItem(LATER) || 0) > now) return
      if (now - Number(localStorage.getItem(SHOWN) || 0) < DAY) return
    } catch {}

    // waits for the intro loader to lift, so the 4 s are really seen
    let wait: ReturnType<typeof setTimeout> | undefined
    const open = () => {
      if (document.documentElement.classList.contains("hari-intro")) { wait = setTimeout(open, 300); return }
      try { localStorage.setItem(SHOWN, String(Date.now())) } catch {}
      setShow(true)
      hide.current = setTimeout(() => setShow(false), VISIBLE)
    }
    const onPrompt = (e: Event) => { e.preventDefault(); setPrompt(e as PromptEvent); open() }
    window.addEventListener("beforeinstallprompt", onPrompt, { once: true })
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent)
    setIos(isIos)
    // iPhone has no install event: open shortly after the page settles
    const t = isIos ? setTimeout(open, 1_000) : undefined
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); clearTimeout(t); clearTimeout(wait); clearTimeout(hide.current) }
  }, [])

  if (!show || (!prompt && !ios)) return null

  const keep = () => clearTimeout(hide.current)
  const later = () => {
    setShow(false)
    try { localStorage.setItem(LATER, String(Date.now() + 14 * DAY)) } catch {}
  }
  const install = async () => {
    if (!prompt) return
    await prompt.prompt()
    await prompt.userChoice.catch(() => null)
    setShow(false)
  }

  return (
    <div className={styles.card} role="dialog" aria-label="Installer l'application" onPointerEnter={keep} onTouchStart={keep} onFocus={keep}>
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
