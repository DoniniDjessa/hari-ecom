"use client"

import { useEffect, useState } from "react"
import { checkPoints, type Balance } from "@/app/(site)/fidelite/actions"
import { formatPrice } from "@/lib/site"
import styles from "./LoyaltyCheck.module.css"

/** Phone field → the Hari Gold balance, with the progress to the next voucher. The number used at
 *  checkout is offered first (hari-customer). */
export function LoyaltyCheck({ rewardPoints, rewardValue, unit = "points" }: {
  rewardPoints: number
  rewardValue: number
  /** "points" (by amount) or "achats" (by number of purchases), from the web app's rules */
  unit?: "points" | "achats"
}) {
  const [phone, setPhone] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [balance, setBalance] = useState<Balance | null>(null)

  useEffect(() => {
    try {
      const info = JSON.parse(localStorage.getItem("hari-customer") || "null")
      if (info?.phone) setPhone(info.phone)
    } catch {}
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError("")
    const r = await checkPoints(phone).catch(() => ({ ok: false as const, error: "Connexion perdue, réessayez." }))
    setBusy(false)
    if (!r.ok) return setError(r.error)
    setBalance(r.balance)
  }

  const progress = balance ? ((rewardPoints - balance.toNext) / rewardPoints) * 100 : 0

  return (
    <div className={styles.box}>
      <form onSubmit={submit} className={styles.form}>
        <label htmlFor="gold-phone">Votre numéro de téléphone</label>
        <div>
          <input id="gold-phone" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07 07 07 07 07" />
          <button type="submit" className="btn btn-real-gold" disabled={busy}>{busy ? "…" : "Voir mes points"}</button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </form>

      {balance && (
        <div className={styles.balance}>
          <p className={styles.points}>
            <strong>{balance.points}</strong> {unit === "achats" ? "achat" : "point"}{balance.points > 1 ? "s" : ""} Hari Gold
          </p>
          {balance.vouchers > 0 ? (
            <p className={styles.reward}>
              Vous avez droit à <strong>{balance.vouchers} bon{balance.vouchers > 1 ? "s" : ""} de {formatPrice(rewardValue)}</strong>
              {balance.vouchers > 1 ? ` (${formatPrice(balance.value)})` : ""} : signalez-le à la commande ou en boutique.
            </p>
          ) : (
            <p className={styles.reward}>Encore <strong>{balance.toNext} {unit}</strong> pour un bon de {formatPrice(rewardValue)}.</p>
          )}
          <div className={styles.bar} aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
          {balance.orders === 0 && <p className={styles.hint}>Aucun achat trouvé pour ce numéro : vérifiez qu&apos;il s&apos;agit de celui donné à la commande ou en caisse.</p>}
        </div>
      )}
    </div>
  )
}
