import type { NextConfig } from "next"

// Product photos come from /api/img (R2, read by the server): next/image resizes and compresses them
const nextConfig: NextConfig = {
  // NEXT_DIST_DIR: a production build next to a running `next dev` (they must not share .next)
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000, // an R2 key never changes content
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
      // the service worker is always checked for a new version
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
    ]
  },
}

export default nextConfig
