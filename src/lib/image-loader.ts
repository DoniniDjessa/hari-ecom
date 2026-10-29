// next/image loader: photos are resized and compressed by Cloudflare (images.haristorecosmetics.com,
// /cdn-cgi/image/), not by Vercel. Cloudflare fetches the original from the live site (/api/img, which
// only serves haritest/ecom/, so the R2 bucket stays private) and keeps each size for a year.
// format=auto: AVIF or WebP, whichever the phone reads. In development, the original as is.
const CDN = "https://images.haristorecosmetics.com/cdn-cgi/image"
const ORIGIN = "https://www.haristorecosmetics.com"

export default function cloudflareLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // blob:/data: previews (backoffice) and outside addresses are left alone
  if (process.env.NODE_ENV !== "production" || !src.startsWith("/")) return src
  return `${CDN}/width=${width},quality=${quality || 75},format=auto/${ORIGIN}${src}`
}
