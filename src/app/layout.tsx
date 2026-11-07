import type { Metadata, Viewport } from "next"
import { Baumans, Cookie, Hachi_Maru_Pop } from "next/font/google"
import localFont from "next/font/local"
import "./globals.css"
import { SITE } from "@/lib/site"

// the text and the big titles. A file of the project (app/fonts, latin subset of the Google font, OFL
// licence, a variable font: every weight from 400 to 800), not downloaded from Google when building: the
// download kept failing in local development and the site then showed Arial instead.
const jakarta = localFont({ src: "./fonts/PlusJakartaSans-latin.woff2", weight: "400 800", variable: "--font-jakarta", display: "swap" })
// the calligraphy: handwriting accents (.script)
const cookie = Cookie({ subsets: ["latin"], weight: "400", variable: "--font-cookie" })
// the brand names
const baumans = Baumans({ subsets: ["latin"], weight: "400", variable: "--font-baumans" })
// the small titles (h3–h6) and the product names
const hachi = Hachi_Maru_Pop({ subsets: ["latin"], weight: "400", variable: "--font-hachi" })

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
  // + /favicon.ico (src/app): Google shows the icon beside the results, from a multiple of 48 px
  icons: {
    icon: [{ url: "/icons/icon-48.png", sizes: "48x48", type: "image/png" }, { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: "/icons/apple-touch-icon.png",
  },
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
    <html lang="fr" className={`${jakarta.variable} ${cookie.variable} ${baumans.variable} ${hachi.variable}`} suppressHydrationWarning>
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
