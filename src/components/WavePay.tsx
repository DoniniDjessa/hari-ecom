"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { formatPrice, SITE, WAVE_FEE_PERCENT, waveAmount, waveFee, whatsappLink } from "@/lib/site"
import {
  declareWavePayment, getWavePayment, payAtDeliveryInstead, startWavePayment,
} from "@/app/(site)/panier/wave-actions"
import { ArrowIcon, CheckIcon } from "./icons"
import cart from "./CartPage.module.css"
import styles from "./WavePay.module.css"

// Paying an order with Wave, after it is placed. Wave doesn't tell the site whether the money arrived:
// the shop checks it by hand. So the client is never told "commande validée" just for opening the link:
//   pay      → the Wave link opens (each click is an attempt the shop sees)
//   back     → "Avez-vous terminé le paiement ?" yes / no, try again
//   checking → "Paiement en cours de vérification" (asks the site every 15 s)
//   paid     → only once the shop has confirmed the money in Wave Business
// Kept in this browser (localStorage) so the client finds it again when coming back from the Wave app.

export const WAVE_KEY = "hari-wave-order"

export type WaveOrder = {
  orderId: string
  number: string
  total: number
  phone: string
  attemptId?: string
  step: "pay" | "back" | "checking" | "paid" | "livraison" | "cancelled"
}

export const saveWaveOrder = (o: WaveOrder | null) => {
  try {
    if (o) localStorage.setItem(WAVE_KEY, JSON.stringify(o))
    else localStorage.removeItem(WAVE_KEY)
  } catch {}
}

export const readWaveOrder = (): WaveOrder | null => {
  try {
    const o = JSON.parse(localStorage.getItem(WAVE_KEY) || "null")
    return o && typeof o.orderId === "string" && typeof o.number === "string" ? o : null
  } catch {
    return null
  }
}

const WaveMark = ({ size = 28 }: { size?: number }) => (
  <Image src="/wave.jpg" alt="Wave" width={size} height={size} className={styles.mark} unoptimized />
)

export function WavePay({ initial, onClose }: { initial: WaveOrder; onClose: () => void }) {
  const [o, setO] = useState<WaveOrder>(initial)
  const [payer, setPayer] = useState(initial.phone)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const update = (patch: Partial<WaveOrder>) => {
    setO((cur) => {
      const next = { ...cur, ...patch }
      saveWaveOrder(next.step === "paid" || next.step === "cancelled" ? null : next)
      return next
    })
  }

  // where the payment stands, from the shop: on arrival, then every 15 s while it is being checked
  useEffect(() => {
    let live = true
    const refresh = async () => {
      const s = await getWavePayment(o.orderId).catch(() => null)
      if (!live || !s) return
      if (s.cancelled) update({ step: "cancelled" })
      else if (s.payment === "paid") update({ step: "paid" })
      else if (s.payment === "livraison") update({ step: "livraison" })
    }
    refresh()
    if (o.step !== "checking" && o.step !== "back") return () => { live = false }
    const t = setInterval(() => document.visibilityState === "visible" && refresh(), 15_000)
    return () => {
      live = false
      clearInterval(t)
    }
  }, [o.orderId, o.step]) // eslint-disable-line react-hooks/exhaustive-deps

  const pay = async () => {
    if (busy) return
    setError("")
    setBusy(true)
    const r = await startWavePayment(o.orderId, payer).catch(() => ({ ok: false as const, error: "Connexion perdue. Réessayez." }))
    if (!r.ok) {
      setBusy(false)
      return setError(r.error)
    }
    // saved before leaving: coming back from the Wave app lands on "Avez-vous terminé le paiement ?"
    update({ attemptId: r.attemptId, phone: payer, step: "back" })
    window.location.href = r.url
    setTimeout(() => setBusy(false), 3000)
  }

  const answer = async (paid: boolean) => {
    if (busy) return
    setBusy(true)
    if (o.attemptId) await declareWavePayment(o.attemptId, paid).catch(() => null)
    setBusy(false)
    update({ step: paid ? "checking" : "pay" })
  }

  const atDelivery = async () => {
    if (busy || !confirm("Payer à la livraison plutôt qu'avec Wave ?\nSi Wave vous a déjà débité, ne changez rien : attendez notre vérification.")) return
    setBusy(true)
    const r = await payAtDeliveryInstead(o.orderId).catch(() => ({ ok: false }))
    setBusy(false)
    if (r.ok) update({ step: "livraison" })
    else setError("Le changement n'a pas pu être fait. Contactez-nous sur WhatsApp.")
  }

  // what the client pays in Wave: the articles + 1 % (o.total stays the articles' total)
  const amount = formatPrice(waveAmount(o.total))
  const help = SITE.whatsapp && (
    <a href={whatsappLink(`Bonjour Hari Store, au sujet du paiement Wave de ma commande ${o.number} (${amount}).`)}
      target="_blank" rel="noopener" className="btn btn-light">
      Une question ? WhatsApp
    </a>
  )

  // ---------- the shop found the money
  if (o.step === "paid") {
    return (
      <div className={cart.empty}>
        <span className={cart.doneIcon}><CheckIcon size={30} /></span>
        <span className="script text-gold">Merci</span>
        <h1>Paiement confirmé</h1>
        <p>
          Nous avons bien reçu votre paiement Wave de <strong>{amount}</strong>. Votre commande <strong>{o.number}</strong> est
          validée : nous vous appelons très vite au {o.phone} pour organiser la livraison.
        </p>
        <div className={cart.doneActions}>
          <Link href="/boutique" className="btn btn-dark" onClick={onClose}>Continuer mes achats <ArrowIcon size={18} /></Link>
        </div>
      </div>
    )
  }

  if (o.step === "cancelled") {
    return (
      <div className={cart.empty}>
        <span className="eyebrow">Commande {o.number}</span>
        <h1>Commande annulée</h1>
        <p>Cette commande a été annulée par la boutique. Si vous avez payé avec Wave, contactez-nous : nous réglons cela avec vous.</p>
        <div className={cart.doneActions}>
          {help}
          <Link href="/boutique" className="btn btn-dark" onClick={onClose}>Retour à la boutique</Link>
        </div>
      </div>
    )
  }

  // ---------- switched to paying at the door: the usual "order sent"
  if (o.step === "livraison") {
    return (
      <div className={cart.empty}>
        <span className={cart.doneIcon}><CheckIcon size={30} /></span>
        <span className="script text-gold">Merci</span>
        <h1>Commande envoyée</h1>
        <p>
          Votre commande <strong>{o.number}</strong> est bien reçue. Vous payerez à la livraison. Nous vous appelons très vite
          au {o.phone} pour confirmer la livraison et ses frais.
        </p>
        <div className={cart.doneActions}>
          <Link href="/boutique" className="btn btn-dark" onClick={() => { saveWaveOrder(null); onClose() }}>
            Continuer mes achats <ArrowIcon size={18} />
          </Link>
        </div>
      </div>
    )
  }

  // ---------- the client said they paid: being checked, never "validée" yet
  if (o.step === "checking") {
    return (
      <div className={cart.empty}>
        <span className={styles.waiting}><WaveMark size={44} /></span>
        <span className="eyebrow">Commande {o.number}</span>
        <h1>Paiement en cours de vérification</h1>
        <p>
          Merci ! Nous vérifions la réception de votre paiement de <strong>{amount}</strong> sur notre compte Wave.
          Dès qu&apos;il est confirmé, votre commande est validée et nous vous appelons au {o.phone}.
        </p>
        <p className={styles.live}><span className={styles.dot} /> En attente de vérification par notre équipe…</p>
        <div className={styles.notice}>
          <strong>Votre commande n&apos;est validée qu&apos;après vérification du paiement.</strong>
          <span>
            Si le paiement n&apos;est pas passé dans Wave (aucun débit sur votre compte), vous pouvez réessayer.
            Si Wave vous a déjà débité, ne payez pas une deuxième fois : attendez simplement notre confirmation.
          </span>
        </div>
        <div className={cart.doneActions}>
          <button type="button" className="btn btn-light" onClick={() => update({ step: "pay" })}>Réessayer le paiement Wave</button>
          {help}
        </div>
        <button type="button" className={styles.link} onClick={onClose}>Continuer mes achats</button>
      </div>
    )
  }

  // ---------- back from the Wave app
  if (o.step === "back") {
    return (
      <div className={cart.empty}>
        <span className={styles.waiting}><WaveMark size={44} /></span>
        <span className="eyebrow">Commande {o.number}</span>
        <h1>Avez-vous terminé le paiement&nbsp;?</h1>
        <p>
          Si vous avez validé le paiement de <strong>{amount}</strong> dans l&apos;application Wave, dites-le-nous : notre équipe
          va le vérifier avant de valider votre commande.
        </p>
        {error && <p className={cart.error}>{error}</p>}
        <div className={styles.choices}>
          <button type="button" className="btn btn-dark" disabled={busy} onClick={() => answer(true)}>
            Oui, j&apos;ai payé
          </button>
          <button type="button" className="btn btn-light" disabled={busy} onClick={() => answer(false)}>
            Non, réessayer le paiement
          </button>
        </div>
        <button type="button" className={styles.link} disabled={busy} onClick={atDelivery}>Je préfère payer à la livraison</button>
      </div>
    )
  }

  // ---------- pay
  return (
    <div className={cart.empty}>
      <span className="eyebrow">Commande {o.number} enregistrée</span>
      <h1 className={styles.headline}>Votre commande sera validée dès que nous aurons reçu et vérifié votre paiement Wave.</h1>

      <div className={styles.card}>
        <div className={styles.amount}>
          <span>Montant à payer</span>
          <strong>{amount}</strong>
          <small>
            Articles {formatPrice(o.total)} + frais Wave {WAVE_FEE_PERCENT} % ({formatPrice(waveFee(o.total))}) · les frais de
            livraison se règlent à la livraison
          </small>
        </div>
        <label className={styles.field}>
          <span>Numéro Wave utilisé pour payer</span>
          <input value={payer} onChange={(e) => setPayer(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="07 00 00 00 00" />
        </label>
        {error && <p className={cart.error}>{error}</p>}
        <button type="button" className={styles.wave} disabled={busy} onClick={pay}>
          <WaveMark size={30} />
          {busy ? "Ouverture de Wave…" : `Payer ${amount} avec Wave`}
        </button>
        <ol className={styles.steps}>
          <li>L&apos;application Wave s&apos;ouvre : saisissez ou vérifiez le montant exact, <strong>{amount}</strong>.</li>
          <li>Validez le paiement dans Wave.</li>
          <li>Revenez sur cette page et confirmez : nous vérifions puis validons votre commande.</li>
        </ol>
      </div>

      <button type="button" className={styles.link} disabled={busy} onClick={atDelivery}>Je préfère payer à la livraison</button>
    </div>
  )
}
