import { StarIcon } from "./icons"

/** 5 stars filled to the rating; `bare`: the stars only, without the figure beside them */
export function Stars({ rating, reviews, size = 13, bare }: { rating: number; reviews?: number; size?: number; bare?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }} aria-label={`Note ${rating.toFixed(1)} sur 5`}>
      <span style={{ display: "inline-flex", gap: 1 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <StarIcon key={i} size={size} filled={Math.max(0, Math.min(1, rating - i))} />
        ))}
      </span>
      {!bare && <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
        {rating.toFixed(1).replace(".", ",")}{reviews ? ` (${reviews})` : ""}
      </span>}
    </span>
  )
}
