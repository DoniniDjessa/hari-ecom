"use server"

import { db } from "@/lib/db"
import { formatPrice, waveAmount, waveLink } from "@/lib/site"

// Paying an order with the shop's Wave link. Wave doesn't tell us whether the payment went through, so
// each click on "Payer avec Wave" is recorded (hari-web-payments) and the shop checks it in its Wave
// Business account (web app › Livraisons › Paiements en ligne). The client is only told the order is
// paid once the shop has found the money. The order id (a random uuid the client got when ordering)
// is what proves the order is theirs.

type Row = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_ATTEMPTS = 10

export type WavePaymentState = {
  number: string
  total: number
  /** pending: not checked yet; paid: the shop found the money; livraison: switched to paying at the door */
  payment: "pending" | "paid" | "livraison"
  cancelled: boolean
}

async function loadOrder(orderId: string): Promise<Row | null> {
  if (!uuid.test(orderId)) return null
  const { data } = await db().from("hari-web-orders")
    .select("id, number, customer_name, total, status, payment_method, payment_status").eq("id", orderId).maybeSingle()
  return data
}

/**
 * The Wave order becomes an order for the shop: shown in the web app from now on, and announced in its
 * notifications. Only the first time (submitted_at still NULL): several clicks, one notification.
 */
async function submitOrder(order: Row, how: string) {
  const { data } = await db().from("hari-web-orders")
    .update({ submitted_at: new Date().toISOString() })
    .eq("id", order.id).is("submitted_at", null).select("id")
  if (!data?.length) return
  await db().from("hari-notifications").insert({
    title: "Nouvelle commande en ligne",
    message: `${order.number} · ${order.customer_name} · ${formatPrice(Number(order.total))} · ${how}`,
    type: "info",
    performed_by_name: "Site e-commerce",
  }).then(({ error: e }) => e && console.error("Notification de commande:", e.message))
}

const stateOf = (o: Row): WavePaymentState => ({
  number: o.number,
  total: Number(o.total) || 0,
  payment: o.payment_method !== "wave" ? "livraison" : o.payment_status === "paid" ? "paid" : "pending",
  cancelled: o.status === "cancelled",
})

/** "Payer avec Wave": records the attempt, gives back the Wave link with the amount */
export async function startWavePayment(orderId: string, payerPhone: string): Promise<
  { ok: true; attemptId: string; url: string } | { ok: false; error: string }
> {
  const phone = String(payerPhone ?? "").trim().slice(0, 40)
  if (phone.replace(/\D/g, "").length < 8) return { ok: false, error: "Indiquez le numéro Wave avec lequel vous payez." }
  const order = await loadOrder(orderId)
  if (!order || order.payment_method !== "wave") return { ok: false, error: "Commande introuvable." }
  if (order.status === "cancelled") return { ok: false, error: "Cette commande a été annulée. Contactez-nous." }
  if (order.payment_status === "paid") return { ok: false, error: "Le paiement de cette commande est déjà confirmé." }

  const { count } = await db().from("hari-web-payments").select("id", { count: "exact", head: true }).eq("order_id", order.id)
  if ((count ?? 0) >= MAX_ATTEMPTS) {
    return { ok: false, error: "Trop de tentatives de paiement pour cette commande. Contactez-nous sur WhatsApp." }
  }

  // the amount the client pays in Wave (articles + 1 %): what the shop looks for in Wave Business
  const amount = waveAmount(Number(order.total))
  const { data, error } = await db().from("hari-web-payments")
    .insert({ order_id: order.id, amount, payer_phone: phone, status: "started" })
    .select("id").single()
  if (error || !data) {
    console.error("Paiement Wave:", error?.message)
    return { ok: false, error: "Le paiement Wave n'est pas disponible pour le moment. Réessayez ou payez à la livraison." }
  }

  // first click on "Payer … avec Wave": only now is it an order for the shop
  await submitOrder(order, `paiement Wave lancé (${formatPrice(amount)}), à vérifier`)
  return { ok: true, attemptId: data.id, url: waveLink(amount) }
}

/** Back from Wave: the client says whether they paid. "Oui" only puts the payment in the shop's list to
 *  check: it never marks the order paid. */
export async function declareWavePayment(attemptId: string, paid: boolean): Promise<{ ok: boolean }> {
  if (!uuid.test(attemptId)) return { ok: false }
  const { error } = await db().from("hari-web-payments")
    .update(paid ? { status: "declared", declared_at: new Date().toISOString() } : { status: "abandoned" })
    .eq("id", attemptId).in("status", ["started", "declared", "abandoned"])
  if (error) console.error("Paiement Wave:", error.message)
  return { ok: !error }
}

/** Where the payment of the order stands (the waiting screen asks every few seconds) */
export async function getWavePayment(orderId: string): Promise<WavePaymentState | null> {
  const order = await loadOrder(orderId)
  return order ? stateOf(order) : null
}

/** The client gives up Wave: they will pay at the door, as usual */
export async function payAtDeliveryInstead(orderId: string): Promise<{ ok: boolean }> {
  const order = await loadOrder(orderId)
  if (!order || order.payment_method !== "wave" || order.payment_status === "paid") return { ok: false }
  const { error } = await db().from("hari-web-orders")
    .update({ payment_method: "livraison", payment_status: "none", updated_at: new Date().toISOString() })
    .eq("id", order.id).neq("payment_status", "paid")
  if (error) return { ok: false }
  // its attempts no longer wait for a check
  await db().from("hari-web-payments").update({ status: "abandoned" })
    .eq("order_id", order.id).in("status", ["started", "declared"])
  // never opened Wave: it becomes an order now, paid at the door
  await submitOrder(order, "paiement à la livraison")
  return { ok: true }
}
