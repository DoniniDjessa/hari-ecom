"use client"

import { useState } from "react"
import type { Shop } from "@/lib/content"
import { ArrowIcon } from "./icons"
import styles from "./ShopsMap.module.css"

// Our shops on a simple Google map (the free embed: no key). The embed shows one place at a time: the
// cards on the left choose the shop shown; "Itinéraire" opens the route in Google Maps. The shops and
// their coordinates are set in the backoffice (Backoffice › Nos boutiques).
const embed = (s: Shop) => `https://maps.google.com/maps?q=${s.lat},${s.lng}&z=16&hl=fr&output=embed`
const route = (s: Shop) => `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`

export function ShopsMap({ shops }: { shops: Shop[] }) {
  const [active, setActive] = useState(0)
  const shop = shops[active] ?? shops[0]
  if (!shop) return null

  return (
    <div className={styles.wrap}>
      <ul className={styles.list}>
        {shops.map((s, i) => (
          <li key={`${s.name}-${i}`} className={i === active ? styles.on : ""}>
            <button type="button" className={styles.shop} onClick={() => setActive(i)} aria-pressed={i === active}>
              <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.info}>
                <strong>{s.name}</strong>
                {s.city && <span>{s.city}</span>}
              </span>
            </button>
            <a href={route(s)} target="_blank" rel="noopener" className={styles.route}>
              Itinéraire <ArrowIcon size={15} />
            </a>
          </li>
        ))}
      </ul>
      <div className={styles.map}>
        <iframe key={active} src={embed(shop)} title={`Carte : ${shop.name}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      </div>
    </div>
  )
}
