import Image from "next/image"
import styles from "./ProductVisual.module.css"

// The website photo on its studio background; without one yet, a quiet tile with the mark and the brand
export function ProductVisual({ src, alt, brand, sizes, priority }: {
  src: string | null
  alt: string
  brand?: string
  sizes: string
  priority?: boolean
}) {
  if (src) return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={styles.img} />
  return (
    <div className={styles.empty} aria-label={alt} role="img">
      <Image src="/haristore-mark.png" alt="" width={64} height={41} />
      {brand && <span>{brand}</span>}
    </div>
  )
}
