import { getObject, isEcomKey } from "@/lib/r2"

// Website photos (R2, folder haritest/ecom/ only): read by the server and served with a long cache.
// A key never changes content (timestamp + uuid), so the browser and the CDN keep it for a year.
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.map(decodeURIComponent).join("/")
  if (!isEcomKey(key)) return new Response("Introuvable", { status: 404 })
  try {
    const { bytes, contentType } = await getObject(key)
    return new Response(Buffer.from(bytes), {
      headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable" },
    })
  } catch {
    return new Response("Introuvable", { status: 404 })
  }
}
