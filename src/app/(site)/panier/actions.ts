"use server"

import { headers } from "next/headers"
import { db } from "@/lib/db"
import { formatPrice } from "@/lib/site"

// Places an order from the cart: it lands in the web app (Livraisons › Commandes en ligne), which calls
// the client back to confirm. Only ids and quantities come from the browser: names, prices and
// availability are read again from the catalogue here.

export type OrderInput = {
  name: string
  phone: string
  place: string
  note: string
  /** cart lines: a product id, or "pack:<id>" */
  lines: { id: string; quantity: number }[]
}

type Row = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
type Item = { kind: "product" | "pack"; id: string; code?: string; name: string; quantity: number; unitPrice: number; total: number; detail?: string }

// orders per address, kept in memory: 5 in 10 minutes at most
const recent = new Map<string, number[]>()

const uuid = /^[0-9a-f-]{36}$/i
const stockOf = (r: Row) => ((r.stock ?? []) as Row[]).reduce((n, s) => n + Number(s.quantity || 0), 0)

export async function placeOrder(input: OrderInput): Promise<{ ok: true; number: string } | { ok: false; error: string }> {
  const name = String(input.name ?? "").trim().slice(0, 120)
  const phone = String(input.phone ?? "").trim().slice(0, 40)
  const place = String(input.place ?? "").trim().slice(0, 300)
  const note = String(input.note ?? "").trim().slice(0, 1000)
  if (name.length < 2) return { ok: false, error: "Indiquez votre nom." }
  if (phone.replace(/\D/g, "").length < 8) return { ok: false, error: "Indiquez un numéro de téléphone valide." }
  if (place.length < 3) return { ok: false, error: "Indiquez votre lieu de livraison (commune, quartier, repère)." }

  const lines = (Array.isArray(input.lines) ? input.lines : [])
    .map((l) => ({ id: String(l.id ?? ""), quantity: Math.floor(Number(l.quantity)) }))
    .filter((l) => l.quantity >= 1 && l.quantity <= 99)
    .slice(0, 60)
  if (!lines.length) return { ok: false, error: "Votre panier est vide." }

  const h = await headers()
  const who = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local"
  const times = (recent.get(who) ?? []).filter((t) => t > Date.now() - 10 * 60_000)
  if (times.length >= 5) return { ok: false, error: "Trop de commandes en peu de temps. Réessayez dans quelques minutes." }

  const productIds = lines.filter((l) => !l.id.startsWith("pack:") && uuid.test(l.id)).map((l) => l.id)
  const packIds = lines.filter((l) => l.id.startsWith("pack:")).map((l) => l.id.slice(5)).filter((id) => uuid.test(id))

  const [products, packs] = await Promise.all([
    productIds.length
      ? db().from("hari-products").select("id, code, name, price, active, on_site, stock:hari-stock(quantity)").in("id", productIds)
      : Promise.resolve({ data: [], error: null }),
    packIds.length
      ? db().from("hari-packs").select("id, name, price, active, items:hari-pack-items(quantity, product:hari-products(name, active, stock:hari-stock(quantity)))" as string).in("id", packIds)
      : Promise.resolve({ data: [], error: null }),
  ])
  if (products.error || packs.error) {
    console.error("Commande:", products.error?.message ?? packs.error?.message)
    return { ok: false, error: "La commande n'a pas pu être enregistrée. Réessayez dans un instant." }
  }
  const byProduct = new Map(((products.data ?? []) as Row[]).map((p) => [p.id, p]))
  const byPack = new Map(((packs.data ?? []) as unknown as Row[]).map((p) => [p.id, p]))

  const items: Item[] = []
  const unavailable: string[] = []
  for (const l of lines) {
    if (l.id.startsWith("pack:")) {
      const p = byPack.get(l.id.slice(5))
      const parts = ((p?.items ?? []) as Row[]).filter((i) => i.product)
      if (!p || !p.active || !parts.length || parts.some((i) => !i.product.active || stockOf(i.product) < Number(i.quantity) * l.quantity)) {
        unavailable.push(p?.name ? `Pack ${p.name}` : "un pack")
        continue
      }
      const unit = Number(p.price) || 0
      items.push({
        kind: "pack", id: p.id, name: `Pack ${p.name}`, quantity: l.quantity, unitPrice: unit, total: unit * l.quantity,
        detail: parts.map((i) => `${Number(i.quantity) > 1 ? `${i.quantity} × ` : ""}${i.product.name}`).join(", "),
      })
    } else {
      const p = byProduct.get(l.id)
      if (!p || !p.active || !p.on_site || stockOf(p) < l.quantity) {
        unavailable.push(p?.name ?? "un produit")
        continue
      }
      const unit = Number(p.price) || 0
      items.push({ kind: "product", id: p.id, code: p.code, name: p.name, quantity: l.quantity, unitPrice: unit, total: unit * l.quantity })
    }
  }
  if (unavailable.length) {
    return { ok: false, error: `Plus disponible en quantité suffisante : ${unavailable.join(", ")}. Retirez-le ou réduisez la quantité.` }
  }

  const total = items.reduce((n, i) => n + i.total, 0)
  const { data, error } = await db()
    .from("hari-web-orders")
    .insert({ customer_name: name, customer_phone: phone, address: place, note, items, total })
    .select("number")
    .single()
  if (error || !data) {
    console.error("Commande:", error?.message)
    return { ok: false, error: /hari-web-orders|schema cache/.test(error?.message ?? "")
      ? "Les commandes en ligne ne sont pas encore ouvertes."
      : "La commande n'a pas pu être enregistrée. Réessayez dans un instant." }
  }

  recent.set(who, [...times, Date.now()])
  // the shop sees it in the web app's notifications
  await db().from("hari-notifications").insert({
    title: "Nouvelle commande en ligne",
    message: `${data.number} · ${name} · ${items.reduce((n, i) => n + i.quantity, 0)} article(s) · ${formatPrice(total)}`,
    type: "info",
    performed_by_name: "Site e-commerce",
  }).then(({ error: e }) => e && console.error("Notification de commande:", e.message))

  return { ok: true, number: data.number }
}
