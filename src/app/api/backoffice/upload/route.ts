import { NextResponse } from "next/server"
import { hasSession } from "@/lib/backoffice"
import { putSiteImage } from "@/lib/r2"

// Image of the backoffice (hero, about, round images of the universes) → R2 haritest/ecom/site/.
// Returns its path (/api/img/…), saved with the texts when the backoffice is saved.
export async function POST(request: Request) {
  if (!(await hasSession())) return NextResponse.json({ error: "Session expirée : entrez à nouveau le code." }, { status: 401 })
  const file = (await request.formData()).get("file")
  if (!(file instanceof File)) return NextResponse.json({ error: "Aucune image reçue." }, { status: 400 })
  try {
    const src = await putSiteImage(new Uint8Array(await file.arrayBuffer()))
    return NextResponse.json({ src })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Échec de l'envoi." }, { status: 400 })
  }
}
