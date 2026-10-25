import type { Metadata, Viewport } from "next"
import { Great_Vibes, Outfit, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { SITE } from "@/lib/site"

const outfit = Outfit({ subsets: ["latin"], weight: ["600", "700", "800", "900"], variable: "--font-outfit" })
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-jakarta" })
// handwriting, for a few accents (.script)
const vibes = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--font-vibes" })

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.fullName} | Cosmétiques authentiques à Abidjan, livrés chez vous`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.fullName,
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE.fullName, description: SITE.description, siteName: SITE.fullName, locale: "fr_FR", type: "website", url: "/",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: SITE.fullName }],
  },
  twitter: { card: "summary_large_image", title: SITE.fullName, description: SITE.description, images: ["/og-image.jpg"] },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: SITE.name, statusBarStyle: "default" },
  formatDetection: { telephone: false },
  // Google Search Console: the code of the "balise HTML" check (NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION)
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : undefined,
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0c0a" },
  ],
}

// The public pages are in (site) (menu, footer, cart); the backoffice has its own layout.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${outfit.variable} ${jakarta.variable} ${vibes.variable}`} suppressHydrationWarning>
      <body>
        {/* theme before paint: the visitor's choice, else the system's */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('hari-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
        {children}
      </body>
    </html>
  )
}
