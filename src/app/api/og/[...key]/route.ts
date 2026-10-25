import sharp from "sharp"
import { getObject, isEcomKey } from "@/lib/r2"

// The product photo for link previews (WhatsApp, Facebook, X…): 1200 × 1200 JPEG, a format every app shows
// (the site's photos are WebP). Same key as /api/img, kept a year.
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.map(decodeURIComponent).join("/")
  if (!isEcomKey(key)) return new Response("Introuvable", { status: 404 })
  try {
    const { bytes } = await getObject(key)
    const jpeg = await sharp(Buffer.from(bytes))
      .resize(1200, 1200, { fit: "contain", background: "#f4f1ec" })
      .flatten({ background: "#f4f1ec" })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer()
    return new Response(new Uint8Array(jpeg), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" },
    })
  } catch {
    return new Response("Introuvable", { status: 404 })
  }
}
