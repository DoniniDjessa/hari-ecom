"use client"

import { useFavourites } from "./Saved"
import styles from "./FavButton.module.css"

/** Heart that adds / removes a product from "Mes favoris" (kept in the browser); filled in gold when on */
export function FavButton({ product, className = "", large }: { product: { id: string; name: string; price: number }; className?: string; large?: boolean }) {
  const { ready, isFavourite, toggleFavourite } = useFavourites()
  const on = ready && isFavourite(product.id)
  return (
    <button
      type="button"
      className={`${styles.fav} ${on ? styles.on : ""} ${large ? styles.large : ""} ${className}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavourite(product) }}
      aria-pressed={on}
      aria-label={on ? `Retirer ${product.name} des favoris` : `Ajouter ${product.name} aux favoris`}
      title={on ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <svg viewBox="0 0 24 24" width={large ? 22 : 18} height={large ? 22 : 18} aria-hidden="true">
        <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.3 4.5 6.9 4.5c2.1 0 3.6 1.2 5.1 3 1.5-1.8 3-3 5.1-3 3.6 0 5.5 3.5 4.2 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z" />
      </svg>
    </button>
  )
}
