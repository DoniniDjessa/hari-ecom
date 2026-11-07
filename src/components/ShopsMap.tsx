"use client"

import { useState } from "react"
import type { Shop } from "@/lib/content"
import { SITE, whatsappLink } from "@/lib/site"
import { ArrowIcon, ChatIcon, ChevronIcon, PinIcon } from "./icons"
import styles from "./ShopsMap.module.css"

// Our shops: a big Google map in a gold frame (the free embed: no key; it shows one place at a time), with
// a frosted panel on top of it: tabs to choose the shop, its name and commune, "Itinéraire" (the route in
// Google Maps) and "Nous écrire" (WhatsApp), previous / next. Phones: the map, then the panel under it.
// The shops and their coordinates are set in the backoffice (Backoffice › Nos boutiques).
const embed = (s: Shop) => `https://maps.google.com/maps?q=${s.lat},${s.lng}&z=16&hl=fr&output=embed`
const route = (s: Shop) => `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`
/** "Hari Store Yopougon" → "Yopougon" for the tabs */
const short = (name: string) => name.replace(new RegExp(`^${SITE.name}\\s+`, "i"), "") || name

export function ShopsMap({ shops }: { shops: Shop[] }) {
  const [active, setActive] = useState(0)
  const shop = shops[active] ?? shops[0]
  if (!shop) return null
  const go = (step: number) => setActive((i) => (i + step + shops.length) % shops.length)
  const num = (i: number) => String(i + 1).padStart(2, "0")

  return (
    <div className={styles.wrap}>
      <div className={styles.map}>
        <iframe key={active} src={embed(shop)} title={`Carte : ${shop.name}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      </div>

      <div className={styles.panel}>
        {shops.length > 1 && (
          <div className={styles.tabs} role="tablist" aria-label="Choisir une boutique">
            {shops.map((s, i) => (
              <button
                key={`${s.name}-${i}`}
                type="button"
                role="tab"
                aria-selected={i === active}
                className={i === active ? styles.tabOn : ""}
                onClick={() => setActive(i)}
              >
                {short(s.name)}
              </button>
            ))}
          </div>
        )}

        <div key={active} className={styles.shop}>
          <span className={`script text-gold ${styles.kicker}`}>Boutique n°{active + 1}</span>
          <h3 className={styles.name}>{shop.name}</h3>
          {shop.city && <p className={styles.city}><PinIcon size={17} /> {shop.city}</p>}
          <p className={styles.text}>Venez voir, sentir et essayer nos soins, avec les conseils de nos conseillères.</p>

          <div className={styles.actions}>
            <a href={route(shop)} target="_blank" rel="noopener" className="btn btn-real-gold">
              Itinéraire <ArrowIcon size={17} />
            </a>
            {SITE.whatsapp && (
              <a href={whatsappLink(`Bonjour ${SITE.name}, je souhaite passer à votre boutique ${shop.name}.`)} target="_blank" rel="noopener noreferrer" className={styles.chat}>
                <ChatIcon size={17} /> Nous écrire
              </a>
            )}
          </div>
        </div>

        {shops.length > 1 && (
          <div className={styles.foot}>
            <span className={styles.counter}><strong>{num(active)}</strong> / {String(shops.length).padStart(2, "0")}</span>
            <span className={styles.arrows}>
              <button type="button" onClick={() => go(-1)} aria-label="Boutique précédente"><ChevronIcon size={18} className={styles.back} /></button>
              <button type="button" onClick={() => go(1)} aria-label="Boutique suivante"><ChevronIcon size={18} /></button>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
