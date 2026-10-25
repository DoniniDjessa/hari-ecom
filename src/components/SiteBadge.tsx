import styles from "./SiteBadge.module.css"

// The badge chosen in the web app (Produits › Site e-commerce, Paramètres › Packs), in its colour:
// gold: Best-seller, Exclusivité · black: Spécial Hari Store, Édition limitée · beige: Coup de cœur,
// Recommandé · white: Nouveau and any text typed by hand. Size and place come from `className`.
const TONES: Record<string, "gold" | "black" | "beige"> = {
  "best-seller": "gold",
  "bestseller": "gold",
  "exclusivite": "gold",
  "special hari store": "black",
  "edition limitee": "black",
  "coup de coeur": "beige",
  "recommande": "beige",
}

const key = (label: string) =>
  label.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/œ/g, "oe").replace(/\s+/g, " ").trim()

export const badgeTone = (label: string) => TONES[key(label)] ?? "white"

export function SiteBadge({ label, className = "" }: { label: string; className?: string }) {
  if (!label) return null
  return <span className={`${styles.badge} ${styles[badgeTone(label)]} ${className}`}>{label}</span>
}
