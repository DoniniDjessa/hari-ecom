"use client"

import { useEffect, useRef, useState } from "react"
import { SITE, whatsappLink } from "@/lib/site"
import { ArrowIcon, ChatIcon } from "./icons"
import styles from "./HomeSections.module.css"

/** Counts up to the number inside `value` ("600+", "100%") once it scrolls into view */
export function Counter({ value, duration = 1600 }: { value: string; duration?: number }) {
  const match = value.match(/^([\d\s ]+)(.*)$/)
  const target = match && !value.includes("/") ? Number(match[1].replace(/\D/g, "")) : null
  const [n, setN] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (target === null || !ref.current) return
    const el = ref.current
    let frame = 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration)
        setN(Math.round(target * (1 - Math.pow(1 - t, 3))))
        if (t < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }, { threshold: 0.4 })
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [target, duration])

  if (target === null) return <span>{value}</span>
  return <span ref={ref}>{n.toLocaleString("fr-FR")}{match![2]}</span>
}

/** Our commitments: big figures (counting up), a gold line grows on top of each when revealed */
export function Commitments({ items }: { items: { value: string; label: string; text: string }[] }) {
  return (
    <div className={styles.commit}>
      <div className={styles.head}>
        <p className="eyebrow">Hari Store en chiffres</p>
        <h2 className={styles.title}>Une sélection exigeante.</h2>
      </div>
      <ul className={`${styles.commitGrid} stagger`}>
        {items.map((c) => (
          <li key={c.label}>
            <strong><Counter value={c.value} /></strong>
            <span>{c.label}</span>
            <p>{c.text}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Paragraph whose words light up one after the other as it scrolls through the screen */
export function ScrollText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [lit, setLit] = useState(0)
  const words = text.split(" ")

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let frame = 0
    const update = () => {
      frame = 0
      const box = el.getBoundingClientRect()
      const vh = window.innerHeight
      // 0 when the paragraph enters at 85 % of the screen, 1 when its bottom reaches 40 %
      const p = reduced ? 1 : (vh * 0.85 - box.top) / (box.height + vh * 0.45)
      setLit(Math.round(Math.min(1, Math.max(0, p)) * words.length))
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      cancelAnimationFrame(frame)
    }
  }, [words.length])

  return (
    <p ref={ref} className={`${styles.scrollText} ${className ?? ""}`} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden="true" className={i < lit ? styles.lit : ""}>{w} </span>
      ))}
    </p>
  )
}

const FAQ = [
  { q: "Comment passer commande ?", a: "Ajoutez vos soins au panier, indiquez votre nom, votre téléphone et votre lieu de livraison, puis validez : votre commande nous arrive sur WhatsApp. Nous vous rappelons pour confirmer." },
  { q: "Livrez-vous partout à Abidjan ?", a: "Oui, dans toutes les communes d'Abidjan. Le délai et les frais de livraison dépendent de votre quartier : nous vous les confirmons avant l'envoi." },
  { q: "Comment puis-je payer ?", a: "À la livraison, en espèces ou par Mobile Money (Wave, Orange Money, MTN, Moov). Vous ne payez qu'à la réception de votre colis." },
  { q: "Vos produits sont-ils authentiques ?", a: "Tous nos produits viennent de nos boutiques de Yopougon et Cocody, où ils sont sélectionnés et contrôlés. Nous ne vendons que ce que nous connaissons." },
  { q: "Je ne sais pas quel soin choisir…", a: "Écrivez-nous sur WhatsApp en décrivant votre peau et votre besoin (taches, hydratation, éclat, sensibilité) : une conseillère vous oriente vers le soin adapté, sans pression." },
]

/** FAQ: numbered accordion, one answer open at a time, smooth height */
export function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <div className={styles.faq}>
      <div className={styles.faqAside}>
        <p className="eyebrow">Questions fréquentes</p>
        <h2 className={styles.title}>Commander, simplement.</h2>
        <p className={styles.faqText}>Tout ce qu&apos;il faut savoir sur la commande, la livraison et le paiement. Une autre question ? Nous répondons vite.</p>
        {SITE.whatsapp && (
          <div className={styles.faqActions}>
            <a href={whatsappLink(`Bonjour ${SITE.name}, j'ai une question.`)} target="_blank" rel="noopener noreferrer" className="btn btn-dark">
              Poser une question <ArrowIcon size={18} />
            </a>
            <a href={whatsappLink(`Bonjour ${SITE.name}.`)} target="_blank" rel="noopener noreferrer" className="link-more"><ChatIcon size={18} /> WhatsApp</a>
          </div>
        )}
      </div>
      <ol className={styles.faqList}>
        {FAQ.map((f, i) => {
          const isOpen = open === i
          return (
            <li key={f.q} className={`${styles.faqItem} ${isOpen ? styles.faqOpen : ""}`}>
              <button className={styles.faqQ} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}>
                <span className={styles.faqNum}>{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.faqLabel}>{f.q}</span>
                <span className={styles.faqIcon} aria-hidden="true" />
              </button>
              <div className={styles.faqA} role="region">
                <div><p>{f.a}</p></div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
