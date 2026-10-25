import type { MetadataRoute } from "next"
import { SITE } from "@/lib/site"

// The site installs like an app (icon on the home screen, opens full screen): Android/Chrome offer it,
// on iPhone "Partager › Sur l'écran d'accueil" (InstallApp explains it).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.fullName,
    short_name: SITE.name,
    description: SITE.description,
    lang: "fr",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    background_color: "#f4f1ec",
    theme_color: "#ffffff",
    categories: ["shopping", "beauty", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Boutique", url: "/boutique", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Mes favoris", url: "/favoris", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Diagnostic de peau", url: "/diagnostic", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  }
}
