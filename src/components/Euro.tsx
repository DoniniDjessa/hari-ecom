import { formatEuro } from "@/lib/site"

/** The price in euros under the price in FCFA ("24 €"), for the clients abroad (lib/site.ts: rate + margin) */
export function Euro({ amount, className = "" }: { amount: number; className?: string }) {
  if (!(amount > 0)) return null
  return <span className={`euro ${className}`} title="Prix indicatif en euros, paiement en FCFA">{formatEuro(amount)}</span>
}
