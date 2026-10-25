// Audience events (Google Analytics 4 and, if set, the Meta pixel): sent only when the tools are loaded
// (components/Analytics.tsx, NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_META_PIXEL_ID). Never blocks the page.
type Item = { id: string; name: string; price: number; quantity?: number; brand?: string; category?: string }

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
  }
}

const META: Record<string, string> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
  search: "Search",
  add_to_wishlist: "AddToWishlist",
}

export function track(event: string, data: { items?: Item[]; value?: number; transaction_id?: string; search_term?: string } = {}) {
  try {
    const items = data.items?.map((i) => ({
      item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity ?? 1, item_brand: i.brand, item_category: i.category,
    }))
    window.gtag?.("event", event, { currency: "XOF", ...data, items })
    const meta = META[event]
    if (meta && window.fbq) {
      window.fbq("track", meta, {
        currency: "XOF",
        value: data.value ?? data.items?.reduce((n, i) => n + i.price * (i.quantity ?? 1), 0),
        content_ids: data.items?.map((i) => i.id),
        content_type: "product",
        search_string: data.search_term,
      })
    }
  } catch {
    // statistics never break the shop
  }
}
