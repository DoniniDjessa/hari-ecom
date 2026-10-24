import type { Metadata } from "next"
import { CartPage } from "@/components/CartPage"

export const metadata: Metadata = { title: "Panier", robots: { index: false } }

export default function Panier() {
  return <CartPage />
}
