"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath, updateTag } from "next/cache"
import { db } from "@/lib/db"
import { listSiteImages } from "@/lib/r2"
import { checkCode, closeSession, openSession, requireSession } from "@/lib/backoffice"
import { mergeContent, type SiteContent } from "@/lib/content"

export async function login(_prev: { error: string } | null, form: FormData): Promise<{ error: string } | null> {
  const code = String(form.get("code") ?? "")
  if (!code.trim()) return { error: "Entrez le code d'accès." }
  const h = await headers()
  const who = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local"
  const result = await checkCode(code, who)
  if (result === "locked") return { error: "Trop d'essais. Réessayez dans 5 minutes." }
  if (result === "wrong") return { error: "Code incorrect." }
  await openSession()
  redirect("/backoffice")
}

export async function logout() {
  await closeSession()
  redirect("/backoffice")
}

/** Saves the texts and images; the site shows them right away. `base` is the version the editor started
 *  from: when it was saved again since (another tab, another device), nothing is written, so an old page
 *  never erases newer work. */
export async function saveContent(content: SiteContent, base: string | null): Promise<
  { ok: true; version: string } | { ok: false; error: string; conflict?: boolean }
> {
  try {
    await requireSession()
    const { data: current } = await db().from("hari-site-settings").select("updated_at").eq("key", "site_content").maybeSingle()
    const now = current?.updated_at ?? null
    if (now && new Date(now).getTime() !== new Date(base ?? 0).getTime()) {
      return { ok: false, conflict: true, error: "Enregistré ailleurs entre-temps (autre onglet ?). Rechargez la page : vos modifications vous seront proposées." }
    }
    const clean = mergeContent(content) // keeps only known fields, trims them
    const version = new Date().toISOString()
    const { error } = await db().from("hari-site-settings").upsert({ key: "site_content", value: clean, updated_at: version })
    if (error) throw new Error(/hari-site-settings|schema cache/.test(error.message)
      ? "Table manquante : exécutez haritest/database/add-ecom-packs-site.sql dans Supabase."
      : error.message)
    updateTag("site-content")
    revalidatePath("/", "layout")
    return { ok: true, version }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Enregistrement impossible." }
  }
}

/** The images already sent from the backoffice, newest first */
export async function listImages(): Promise<{ src: string; at: string }[]> {
  await requireSession()
  return listSiteImages()
}
