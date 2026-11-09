import { formatAmount } from "@/lib/site"

/** A price on the page: the amount, "F" at its size, "CFA" in tiny letters (the texts keep formatPrice) */
export function Price({ amount }: { amount: number }) {
  return <span className="amount">{formatAmount(amount)} F<small className="cur">CFA</small></span>
}
