import "server-only"
import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"
import { unstable_cache } from "next/cache"
import { db } from "./db"
import { DEFAULT_CONTENT, mergeContent, type SiteContent } from "./content"

// Backoffice access: one code (first 0044, changed by the admins in the web app, Paramètres › Site
// e-commerce), stored as sha256('hari-backoffice:' + code) in hari-site-settings. A correct code opens a
// 12 h session: an httpOnly cookie signed with the server key, which also carries the code's hash, so
// changing the code closes every open session.

const COOKIE = "hari_bo"
const HOURS = 12

export const hashCode = (code: string) => createHash("sha256").update(`hari-backoffice:${code}`).digest("hex")
const DEFAULT_HASH = hashCode("0044")

const secret = () => process.env.SUPABASE_SERVICE_ROLE_KEY || "dev-secret"
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("hex")

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/** Hash of the current code (the first code while the setting does not exist yet) */
export async function codeHash(): Promise<string> {
  const { data, error } = await db().from("hari-site-settings").select("value").eq("key", "backoffice_code").maybeSingle()
  if (error) console.error("Code du backoffice:", error.message)
  return typeof data?.value === "string" && data.value ? data.value : DEFAULT_HASH
}

// failed attempts per address, kept in memory: 5 failures → 5 minutes without trying
const failures = new Map<string, { n: number; until: number }>()

export async function checkCode(code: string, who: string): Promise<"ok" | "wrong" | "locked"> {
  const f = failures.get(who)
  if (f && f.until > Date.now()) return "locked"
  await new Promise((r) => setTimeout(r, 400)) // slows down guessing
  if (safeEqual(hashCode(code.trim()), await codeHash())) {
    failures.delete(who)
    return "ok"
  }
  const n = (f?.n ?? 0) + 1
  failures.set(who, { n: n >= 5 ? 0 : n, until: n >= 5 ? Date.now() + 5 * 60_000 : 0 })
  return n >= 5 ? "locked" : "wrong"
}

export async function openSession() {
  const expires = Date.now() + HOURS * 3600_000
  const hash = await codeHash()
  const payload = `${expires}.${hash.slice(0, 16)}`
  ;(await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: HOURS * 3600,
  })
}

export async function closeSession() {
  ;(await cookies()).delete(COOKIE)
}

export async function hasSession(): Promise<boolean> {
  const value = (await cookies()).get(COOKIE)?.value
  if (!value) return false
  const [expires, hash, signature] = value.split(".")
  if (!expires || !hash || !signature || Number(expires) < Date.now()) return false
  if (!safeEqual(signature, sign(`${expires}.${hash}`))) return false
  return hash === (await codeHash()).slice(0, 16)
}

export async function requireSession() {
  if (!(await hasSession())) throw new Error("Session expirée : entrez à nouveau le code.")
}

/** Texts and images of the site (kept 5 min; the backoffice refreshes them when it saves). The cache keeps
 *  what is saved, merged with the defaults on each read: a field added to the site never meets an old cache. */
export async function getSiteContent(): Promise<SiteContent> {
  return mergeContent(await savedContent())
}

const savedContent = unstable_cache(async (): Promise<unknown> => {
  const { data, error } = await db().from("hari-site-settings").select("value").eq("key", "site_content").maybeSingle()
  if (error) {
    // e.g. hari-site-settings missing: haritest/database/add-ecom-packs-site.sql not run yet
    console.error("Contenu du site:", error.message)
    return {}
  }
  return data?.value ?? {}
}, ["site-content-raw"], { revalidate: 300, tags: ["site-content"] })

/** What was saved, without the defaults (the backoffice edits this), and its version: the date of the save */
export async function getSavedContent(): Promise<{ value: unknown; version: string | null }> {
  const { data } = await db().from("hari-site-settings").select("value, updated_at").eq("key", "site_content").maybeSingle()
  return { value: data?.value ?? {}, version: data?.updated_at ?? null }
}
