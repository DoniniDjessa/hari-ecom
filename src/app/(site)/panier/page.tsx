import type { Metadata } from "next"
import { CartPage } from "@/components/CartPage"
import { getLoyaltyRules } from "@/lib/loyalty"

export const metadata: Metadata = { title: "Panier", robots: { index: false } }

export default async function Panier() {
  // Hari Gold (web app › Paramètres): the points an order will earn, shown once it is sent
  const r = await getLoyaltyRules()
  return <CartPage gold={r.active ? { mode: r.mode, perThousand: r.perThousand, minPurchase: r.minPurchase } : null} />
}
