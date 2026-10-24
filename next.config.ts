import type { NextConfig } from "next"

// Product photos come from /api/img (R2, read by the server): next/image resizes and compresses them
const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000, // an R2 key never changes content
  },
}

export default nextConfig
