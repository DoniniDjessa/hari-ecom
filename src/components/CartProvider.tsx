"use client"

import { track } from "@/lib/track"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { CardProduct, CartLine, SitePack } from "@/lib/types"
import { CheckIcon } from "./icons"
import styles from "./CartProvider.module.css"

// The cart lives in the browser (localStorage): no account needed. The order is sent on WhatsApp.
const KEY = "hari-cart"

type Cart = {
  lines: CartLine[]
  count: number
  total: number
  ready: boolean
  add: (p: CardProduct, quantity?: number) => void
  addPack: (p: SitePack) => void
  setQuantity: (id: string, quantity: number) => void
  remove: (id: string) => void
  clear: () => void
}

const CartContext = createContext<Cart | null>(null)

export function useCart() {
  const cart = useContext(CartContext)
  if (!cart) throw new Error("useCart outside CartProvider")
  return cart
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [ready, setReady] = useState(false)
  const [toast, setToast] = useState<{ name: string; n: number } | null>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]")
      if (Array.isArray(saved)) setLines(saved)
    } catch {}
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(KEY, JSON.stringify(lines))
    } catch {}
  }, [lines, ready])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])

  const add = useCallback((p: CardProduct, quantity = 1) => {
    setLines((prev) => {
      const found = prev.find((l) => l.id === p.id)
      if (found) return prev.map((l) => (l.id === p.id ? { ...l, quantity: Math.min(99, l.quantity + quantity) } : l))
      return [...prev, { id: p.id, slug: p.slug, name: p.name, brand: p.brand, price: p.price, image: p.image, quantity }]
    })
    setToast((t) => ({ name: p.name, n: (t?.n ?? 0) + 1 }))
    track("add_to_cart", { value: p.price * quantity, items: [{ id: p.id, name: p.name, price: p.price, quantity, brand: p.brand, category: p.universe }] })
  }, [])

  // a pack is one line (id "pack:…"), its products are listed in the order message
  const addPack = useCallback((p: SitePack) => {
    const id = `pack:${p.id}`
    setLines((prev) => {
      if (prev.some((l) => l.id === id)) return prev.map((l) => (l.id === id ? { ...l, quantity: Math.min(99, l.quantity + 1) } : l))
      const detail = p.items.map((i) => `${i.quantity > 1 ? `${i.quantity} × ` : ""}${i.name}`).join(", ")
      return [...prev, { id, slug: p.slug, name: `Pack ${p.name}`, brand: "Pack", price: p.price, image: p.image ?? p.items[0]?.image ?? null, quantity: 1, href: `/packs/${p.slug}`, detail }]
    })
    setToast((t) => ({ name: `Pack ${p.name}`, n: (t?.n ?? 0) + 1 }))
  }, [])

  const setQuantity = useCallback((id: string, quantity: number) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, quantity: Math.max(1, Math.min(99, quantity)) } : l)))
  }, [])
  const remove = useCallback((id: string) => setLines((prev) => prev.filter((l) => l.id !== id)), [])
  const clear = useCallback(() => setLines([]), [])

  const value = useMemo<Cart>(() => ({
    lines,
    ready,
    count: lines.reduce((n, l) => n + l.quantity, 0),
    total: lines.reduce((n, l) => n + l.quantity * l.price, 0),
    add,
    addPack,
    setQuantity,
    remove,
    clear,
  }), [lines, ready, add, addPack, setQuantity, remove, clear])

  return (
    <CartContext.Provider value={value}>
      {children}
      {toast && (
        <div key={toast.n} className={styles.toast} role="status">
          <span className={styles.check}><CheckIcon size={16} /></span>
          <span className={styles.text}>
            <strong>Ajouté au panier</strong>
            <span>{toast.name}</span>
          </span>
          <Link href="/panier" className={styles.go} onClick={() => setToast(null)}>Voir le panier</Link>
        </div>
      )}
    </CartContext.Provider>
  )
}
