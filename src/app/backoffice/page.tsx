import type { Metadata } from "next"
import { getSavedContent, hasSession } from "@/lib/backoffice"
import { mergeContent } from "@/lib/content"
import { UNIVERSES } from "@/lib/site"
import { BackofficeLogin } from "@/components/backoffice/BackofficeLogin"
import { BackofficeEditor } from "@/components/backoffice/BackofficeEditor"

export const metadata: Metadata = { title: "Backoffice", robots: { index: false, follow: false } }
export const dynamic = "force-dynamic"

export default async function Backoffice() {
  if (!(await hasSession())) return <BackofficeLogin />
  const { value, version } = await getSavedContent()
  return <BackofficeEditor initial={mergeContent(value)} version={version} universes={UNIVERSES.map(({ name, slug, tagline }) => ({ name, slug, tagline }))} />
}
