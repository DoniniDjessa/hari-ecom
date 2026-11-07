"use client"

import { useEffect, useState } from "react"
import type { Review } from "@/lib/reviews"
import { getReviewState, leaveReview } from "@/app/(site)/produit/[slug]/review-actions"
import { Stars } from "./Stars"
import { StarIcon } from "./icons"
import styles from "./ProductReviews.module.css"

// Product page › "Avis clientes": the rating (base rating blended with the visitors', lib/reviews.ts), the
// latest reviews, and the form: 1 to 5 stars, a first name, an optional comment. A device reviews a
// product at most once every 3 months (checked on the server, review-actions.ts): then the form gives way
// to the date it opens again.

const LABELS = ["", "Décevant", "Moyen", "Bien", "Très bien", "Excellent"]
const day = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })

export function ProductReviews({ productId, productName, rating, reviews: count, list }: {
  productId: string; productName: string; rating: number | null; reviews: number; list: Review[]
}) {
  const [items, setItems] = useState(list)
  const [until, setUntil] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [stars, setStars] = useState(0)
  const [hover, setHover] = useState(0)
  const [author, setAuthor] = useState("")
  const [comment, setComment] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [thanks, setThanks] = useState(false)

  useEffect(() => {
    getReviewState(productId).then((s) => !s.canReview && setUntil(s.until)).catch(() => {})
  }, [productId])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (!stars) return setError("Choisissez une note de 1 à 5 étoiles.")
    setBusy(true)
    setError("")
    const r = await leaveReview({ productId, rating: stars, author, comment }).catch(() => ({ ok: false as const, error: "Connexion perdue. Réessayez." }))
    setBusy(false)
    if (!r.ok) {
      setError(r.error)
      if ("until" in r && r.until) setUntil(r.until)
      return
    }
    setItems((cur) => [{ id: r.id, rating: stars, author: author.trim(), comment: comment.trim(), createdAt: r.createdAt }, ...cur])
    setUntil(new Date(new Date(r.createdAt).getTime() + 90 * 86_400_000).toISOString())
    setThanks(true)
    setOpen(false)
  }

  const shown = hover || stars
  return (
    <section className={styles.wrap} id="avis" aria-labelledby="avis-title">
      <div className={styles.head}>
        <div>
          <span className="script text-gold">Elles en parlent</span>
          <h2 id="avis-title" className={styles.title}>Avis clientes</h2>
        </div>
        {rating != null && (
          <div className={styles.score}>
            <strong>{rating.toFixed(1).replace(".", ",")}</strong>
            <span>
              <Stars rating={rating} size={18} bare />
              <small>{count > 0 ? `${count} avis` : "sur 5"}</small>
            </span>
          </div>
        )}
      </div>

      {/* leave a review */}
      <div className={styles.box}>
        {thanks ? (
          <p className={styles.thanks}><strong>Merci pour votre avis !</strong> Il aide les autres clientes à choisir.</p>
        ) : until ? (
          <p className={styles.wait}>
            Vous avez déjà donné votre avis sur ce produit. Vous pourrez en laisser un nouveau à partir du <strong>{day(until)}</strong>.
          </p>
        ) : !open ? (
          <div className={styles.cta}>
            <p>Vous avez essayé <strong>{productName}</strong> ? Partagez votre expérience.</p>
            <button type="button" className="btn btn-dark" onClick={() => setOpen(true)}>Donner mon avis</button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={submit}>
            <div className={styles.picker} role="radiogroup" aria-label="Votre note" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={stars === n}
                  aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                  className={n <= shown ? styles.lit : ""}
                  onMouseEnter={() => setHover(n)}
                  onClick={() => { setStars(n); setError("") }}
                >
                  <StarIcon size={30} filled={n <= shown ? 1 : 0} />
                </button>
              ))}
              <span className={styles.label}>{LABELS[shown] || "Votre note"}</span>
            </div>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Votre prénom" maxLength={60} autoComplete="given-name" />
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Votre avis (facultatif) : résultat, texture, odeur…" rows={4} maxLength={1000} />
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.actions}>
              <button type="submit" className="btn btn-dark" disabled={busy}>{busy ? "Envoi…" : "Publier mon avis"}</button>
              <button type="button" className={styles.cancel} onClick={() => setOpen(false)}>Annuler</button>
            </div>
            <p className={styles.note}>Un avis par produit tous les 3 mois.</p>
          </form>
        )}
      </div>

      {/* the latest reviews */}
      {items.length > 0 && (
        <ul className={styles.list}>
          {items.map((r) => (
            <li key={r.id}>
              <div className={styles.who}>
                <span className={styles.avatar}>{(r.author[0] || "?").toUpperCase()}</span>
                <span><strong>{r.author}</strong><small>{day(r.createdAt)}</small></span>
                <Stars rating={r.rating} size={14} />
              </div>
              {r.comment && <p>{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
