import type { MetadataRoute } from "next"
import { abs } from "@/lib/seo"

// /robots.txt: everything is open except the backoffice, the cart, the favourites and the API (the product
// photos of /api/img and /api/og stay open: Google Images, link previews)
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/api/img/", "/api/og/"], disallow: ["/backoffice", "/panier", "/favoris", "/api/"] }],
    sitemap: abs("/sitemap.xml"),
    host: abs("/"),
  }
}
