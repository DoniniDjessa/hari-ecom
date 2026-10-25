import { getUniverseCards } from "@/lib/catalog"
import { getSiteContent } from "@/lib/backoffice"
import { CartProvider } from "@/components/CartProvider"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { GoToTop, Intro, RevealOnScroll, WhatsAppWidget } from "@/components/Extras"
import { JsonLd } from "@/components/JsonLd"
import { SavedProvider } from "@/components/Saved"
import { InstallApp } from "@/components/InstallApp"
import { Analytics } from "@/components/Analytics"
import { Suspense } from "react"
import { abs } from "@/lib/seo"
import { SITE } from "@/lib/site"
import { ScrollThread } from "@/components/ScrollThread"

export default async function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [universes, content] = await Promise.all([getUniverseCards(), getSiteContent()])
  return (
    <>
      {/* full page load: flag the intro before the page paints. First visit: the whole loader; afterwards
          (hari-intro-seen): the short one, as between two pages */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;var c=document.documentElement.classList;if(localStorage.getItem('hari-intro-seen')){c.add('hari-intro','hari-intro-nav');}else{c.add('hari-intro');localStorage.setItem('hari-intro-seen','1');}}catch(e){}})();`,
        }}
      />
      {/* who we are, the search box Google may show, and the shops (maps, opening) */}
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": abs("/#organisation"),
          name: SITE.fullName,
          url: abs("/"),
          logo: abs("/icons/icon-512.png"),
          description: SITE.description,
          ...(SITE.whatsapp ? { contactPoint: { "@type": "ContactPoint", telephone: `+${SITE.whatsapp}`, contactType: "customer service", areaServed: "CI", availableLanguage: "French" } } : {}),
          sameAs: [content.social.instagram, content.social.facebook, content.social.tiktok].filter(Boolean),
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE.fullName,
          url: abs("/"),
          inLanguage: "fr",
          potentialAction: { "@type": "SearchAction", target: `${abs("/boutique")}?q={search_term_string}`, "query-input": "required name=search_term_string" },
        },
        ...content.shops.map((s) => ({
          "@context": "https://schema.org",
          "@type": "Store",
          name: s.name,
          parentOrganization: { "@id": abs("/#organisation") },
          image: abs("/og-image.jpg"),
          url: abs("/"),
          ...(SITE.whatsapp ? { telephone: `+${SITE.whatsapp}` } : {}),
          address: { "@type": "PostalAddress", addressLocality: s.city.split(",")[0] || "Abidjan", addressRegion: "Abidjan", addressCountry: "CI" },
          geo: { "@type": "GeoCoordinates", latitude: s.lat, longitude: s.lng },
          priceRange: "$$",
        })),
      ]} />
      <CartProvider>
      <SavedProvider>
        <Navbar universes={universes} shops={content.shops} />
        <main>{children}</main>
        <Footer content={content.footer} shops={content.shops} social={content.social} />
        <WhatsAppWidget />
        <GoToTop />
        <ScrollThread />
        <RevealOnScroll />
        <Intro />
        <InstallApp />
      </SavedProvider>
      </CartProvider>
      <Suspense fallback={null}><Analytics /></Suspense>
    </>
  )
}
