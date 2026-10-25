"use client"

import { track } from "@/lib/track"
import { useState } from "react"
import Link from "next/link"
import { placeOrder } from "@/app/(site)/panier/actions"
import { formatPrice, SITE, whatsappLink } from "@/lib/site"
import { useCart } from "./CartProvider"
import { ProductVisual } from "./ProductVisual"
import { ArrowIcon, CheckIcon, MinusIcon, PlusIcon, TrashIcon } from "./icons"
import styles from "./CartPage.module.css"

// Checkout: the order is sent to the shop (web app, Livraisons › Commandes en ligne), which calls the
// client back to confirm the delivery fee and the time. Name, phone and place are remembered in this
// browser for the next order.
const INFO_KEY = "hari-customer"

export function CartPage({ gold }: { gold: { mode: "amount" | "purchases"; perThousand: number; minPurchase: number } | null }) {
  // Hari Gold points (or purchase) an order earns
  const earned = (total: number) => !gold || total < gold.minPurchase ? 0 : gold.mode === "amount" ? Math.floor((total / 1000) * gold.perThousand) : 1
  const { lines, total, count, ready, setQuantity, remove, clear } = useCart()
  const [info, setInfo] = useState(() => {
    const empty = { name: "", phone: "", place: "", note: "" }
    if (typeof window === "undefined") return empty
    try {
      return { ...empty, ...JSON.parse(localStorage.getItem(INFO_KEY) || "{}"), note: "" }
    } catch {
      return empty
    }
  })
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  // the order just sent (the cart is emptied): for the points and the WhatsApp summary
  const [sent, setSent] = useState<{ total: number; summary: string } | null>(null)

  const order = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sending) return
    if (!info.name.trim() || info.phone.replace(/\D/g, "").length < 8 || !info.place.trim()) {
      setError("Indiquez votre nom, un numéro de téléphone valide et votre lieu de livraison.")
      return
    }
    setError("")
    setSending(true)
    try {
      localStorage.setItem(INFO_KEY, JSON.stringify({ name: info.name, phone: info.phone, place: info.place }))
    } catch {}
    const result = await placeOrder({
      name: info.name, phone: info.phone, place: info.place, note: info.note,
      lines: lines.map((l) => ({ id: l.id, quantity: l.quantity })),
    }).catch(() => ({ ok: false as const, error: "Connexion perdue. Réessayez : votre panier est conservé." }))
    setSending(false)
    if (!result.ok) return setError(result.error)
    track("purchase", {
      transaction_id: result.number,
      value: lines.reduce((n, l) => n + l.price * l.quantity, 0),
      items: lines.map((l) => ({ id: l.id, name: l.name, price: l.price, quantity: l.quantity, brand: l.brand })),
    })
    const total = lines.reduce((n, l) => n + l.price * l.quantity, 0)
    setSent({ total, summary: lines.map((l) => `- ${l.quantity} × ${l.name}`).join("\n") })
    clear()
    setDone(result.number)
    window.scrollTo({ top: 0 })
  }

  if (!ready) return <div className={`container ${styles.page}`} />

  // order sent: its number, what happens next
  if (done) {
    return (
      <div className={`container ${styles.page}`}>
        <div className={styles.empty}>
          <span className={styles.doneIcon}><CheckIcon size={30} /></span>
          <span className="script text-gold">Merci</span>
          <h1>Commande envoyée</h1>
          <p>
            Votre commande <strong>{done}</strong> est bien reçue. Nous vous appelons très vite au {info.phone} pour
            confirmer la livraison et ses frais. Paiement à la livraison.
          </p>
          {sent && earned(sent.total) > 0 && (
            <p className={styles.gold}>
              ✪ Une fois livrée, cette commande vous rapportera{" "}
              <strong>{gold?.mode === "purchases" ? "1 achat" : `${earned(sent.total)} points`} Hari Gold</strong>.{" "}
              <Link href="/fidelite">Le programme</Link>
            </p>
          )}
          <div className={styles.doneActions}>
            <Link href="/boutique" className="btn btn-dark">Continuer mes achats <ArrowIcon size={18} /></Link>
            {SITE.whatsapp && (
              <a href={whatsappLink(`Bonjour Hari Store, je viens de passer la commande ${done} :\n${sent?.summary ?? ""}\nNom : ${info.name}\nLivraison : ${info.place}`)}
                target="_blank" rel="noopener" className="btn btn-light">
                Confirmer aussi sur WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!lines.length) {
    return (
      <div className={`container ${styles.page}`}>
        <div className={styles.empty}>
          <span className="eyebrow">Panier</span>
          <h1>Votre panier est vide</h1>
          <p>Découvrez nos soins visage, corps et bien-être.</p>
          <Link href="/boutique" className="btn btn-dark">Aller à la boutique <ArrowIcon size={18} /></Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`container ${styles.page}`}>
      <span className="eyebrow">Panier</span>
      <h1 className={styles.title}>Votre panier <small>{count} article{count > 1 ? "s" : ""}</small></h1>

      <div className={styles.layout}>
        <ul className={styles.lines}>
          {lines.map((l) => (
            <li key={l.id} className={styles.line}>
              <Link href={l.href ?? `/produit/${l.slug}`} className={styles.thumb}>
                <ProductVisual src={l.image} alt={l.name} sizes="110px" />
              </Link>
              <div className={styles.lineInfo}>
                {l.brand && <span className={styles.brand}>{l.brand}</span>}
                <Link href={l.href ?? `/produit/${l.slug}`} className={styles.name}>{l.name}</Link>
                {l.detail && <span className={styles.unit}>{l.detail}</span>}
                <span className={styles.unit}>{formatPrice(l.price)}</span>
                <div className={styles.lineActions}>
                  <div className={styles.qty}>
                    <button type="button" onClick={() => setQuantity(l.id, l.quantity - 1)} disabled={l.quantity <= 1} aria-label="Retirer un"><MinusIcon size={15} /></button>
                    <span>{l.quantity}</span>
                    <button type="button" onClick={() => setQuantity(l.id, l.quantity + 1)} aria-label="Ajouter un"><PlusIcon size={15} /></button>
                  </div>
                  <button type="button" className={styles.remove} onClick={() => remove(l.id)} aria-label={`Retirer ${l.name}`}>
                    <TrashIcon size={18} />
                  </button>
                </div>
              </div>
              <strong className={styles.lineTotal}>{formatPrice(l.price * l.quantity)}</strong>
            </li>
          ))}
        </ul>

        <form className={styles.summary} onSubmit={order}>
          <h2>Récapitulatif</h2>
          <div className={styles.sumRow}><span>Articles</span><span>{formatPrice(total)}</span></div>
          <div className={styles.sumRow}><span>Livraison</span><span>Confirmée par téléphone</span></div>
          <div className={`${styles.sumRow} ${styles.sumTotal}`}><span>Total</span><span>{formatPrice(total)}</span></div>

          <div className={styles.fields}>
            <input value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} placeholder="Nom et prénom" autoComplete="name" />
            <input value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} placeholder="Téléphone" inputMode="tel" autoComplete="tel" />
            <input value={info.place} onChange={(e) => setInfo({ ...info, place: e.target.value })} placeholder="Commune, quartier, repère" autoComplete="street-address" />
            <textarea value={info.note} onChange={(e) => setInfo({ ...info, note: e.target.value })} placeholder="Une précision ? (facultatif)" rows={2} />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className="btn btn-dark" disabled={sending}>{sending ? "Envoi de la commande…" : "Valider la commande"}</button>
          <p className={styles.hint}>Paiement à la livraison, en espèces ou Mobile Money. Nous vous appelons pour confirmer le délai et les frais de livraison.</p>
        </form>
      </div>
    </div>
  )
}
