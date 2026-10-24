import { getUniverseCards } from "@/lib/catalog"
import { getSiteContent } from "@/lib/backoffice"
import { CartProvider } from "@/components/CartProvider"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { GoToTop, Intro, RevealOnScroll, WhatsAppWidget } from "@/components/Extras"
import { ScrollThread } from "@/components/ScrollThread"

export default async function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [universes, content] = await Promise.all([getUniverseCards(), getSiteContent()])
  return (
    <>
      {/* full page load (first visit, reload): flag the intro before the page paints */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('hari-intro');}catch(e){}})();`,
        }}
      />
      <CartProvider>
        <Navbar universes={universes} shops={content.shops} />
        <main>{children}</main>
        <Footer content={content.footer} shops={content.shops} />
        <WhatsAppWidget />
        <GoToTop />
        <ScrollThread />
        <RevealOnScroll />
        <Intro />
      </CartProvider>
    </>
  )
}
