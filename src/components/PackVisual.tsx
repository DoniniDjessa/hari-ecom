import Image from "next/image"
import type { SitePack } from "@/lib/types"
import { ProductVisual } from "./ProductVisual"
import styles from "./PackVisual.module.css"

// A pack's picture, still: its photo (set in the web app); without one, its first product's photo on the
// studio background; without any, "Pack · N soins". Fills its (positioned) parent.
export function PackVisual({ pack: p, sizes, priority }: { pack: SitePack; sizes: string; priority?: boolean }) {
  if (p.image) return <Image src={p.image} alt={p.name} fill sizes={sizes} priority={priority} className={styles.cover} />
  const first = p.items.find((i) => i.image)
  if (first) {
    return (
      <span className={styles.product}>
        <ProductVisual src={first.image} alt={p.name} brand={first.brand} sizes={sizes} priority={priority} />
      </span>
    )
  }
  const count = p.items.reduce((n, i) => n + i.quantity, 0)
  return <span className={styles.empty}><span className="script text-gold">Pack</span><strong>{count} soins</strong></span>
}
