import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"

// Refreshes the site at once when the web app changes something (otherwise the catalog is kept 5 min).
// Called by the web app (lib/notify-site.ts: { tags: ["products"] }) and, in production, by Supabase
// database webhooks (payload { table: "hari-stock", … }) as a safety net for every stock change.
// Header x-revalidate-secret = REVALIDATE_SECRET.
const TAGS = ["products", "packs", "site-content"] as const
const BY_TABLE: Record<string, (typeof TAGS)[number][]> = {
  "hari-products": ["products", "packs"],
  "hari-stock": ["products", "packs"],
  "hari-flash-sales": ["products", "packs"],
  "hari-flash-sale-items": ["products", "packs"],
  "hari-packs": ["packs"],
  "hari-pack-items": ["packs"],
  "hari-site-settings": ["site-content"],
}

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET
  const given = request.headers.get("x-revalidate-secret") ?? ""
  if (!secret || !same(given, secret)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as { tags?: unknown; table?: unknown }
  const asked = Array.isArray(body.tags) ? body.tags : typeof body.table === "string" ? BY_TABLE[body.table] ?? [] : []
  const tags = TAGS.filter((t) => asked.includes(t))
  if (!tags.length) return NextResponse.json({ error: "Rien à rafraîchir" }, { status: 400 })

  for (const t of tags) revalidateTag(t, { expire: 0 })
  revalidatePath("/", "layout") // the pages kept as HTML (home, shop…) too
  return NextResponse.json({ ok: true, tags })
}
