import { StarIcon } from "./icons"

export function Stars({ rating, reviews, size = 13 }: { rating: number; reviews?: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }} aria-label={`Note ${rating.toFixed(1)} sur 5`}>
      <span style={{ display: "inline-flex", gap: 1 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <StarIcon key={i} size={size} filled={Math.max(0, Math.min(1, rating - i))} />
        ))}
      </span>
      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
        {rating.toFixed(1).replace(".", ",")}{reviews ? ` (${reviews})` : ""}
      </span>
    </span>
  )
}
