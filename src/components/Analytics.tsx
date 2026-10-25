"use client"

import Script from "next/script"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"

// Audience measurement, loaded after the page (no slowdown): Google Analytics 4 (NEXT_PUBLIC_GA_ID,
// "G-…") and the Meta pixel for Facebook / Instagram ads (NEXT_PUBLIC_META_PIXEL_ID). Nothing set:
// nothing loaded. GA4 counts the page changes by itself; the pixel is told here.
const GA = process.env.NEXT_PUBLIC_GA_ID
const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID

export function Analytics() {
  const pathname = usePathname()
  const search = useSearchParams()
  const first = useRef(true)

  useEffect(() => {
    if (first.current) return void (first.current = false) // the first view is counted by the snippet
    window.fbq?.("track", "PageView")
  }, [pathname, search])

  return (
    <>
      {GA && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA}');`}
          </Script>
        </>
      )}
      {PIXEL && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  )
}
