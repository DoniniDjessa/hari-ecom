import type { Testimonial } from "@/lib/content"
import { Stars } from "./Stars"
import styles from "./Testimonials.module.css"

// "Ce que disent nos clients": the reviews written in the backoffice. From 4 reviews they scroll in an
// endless band (paused on hover); fewer stay in a grid. No review: nothing is shown.
export function Testimonials({ items }: { items: Testimonial[] }) {
  if (!items.length) return null
  const average = items.reduce((n, t) => n + t.rating, 0) / items.length
  const band = items.length >= 4

  const card = (t: Testimonial, k: string, hidden = false) => (
    <figure key={k} className={styles.card} aria-hidden={hidden || undefined}>
      <span className={styles.quote} aria-hidden="true">“</span>
      <Stars rating={t.rating} size={14} />
      <blockquote>{t.text}</blockquote>
      <figcaption>
        <span className={styles.avatar} aria-hidden="true">{t.name[0]}</span>
        <span className={styles.who}>
          <strong>{t.name}</strong>
          {t.city && <small>{t.city}</small>}
        </span>
        {t.product && <span className={styles.product}>{t.product}</span>}
      </figcaption>
    </figure>
  )

  return (
    <section className={`${styles.section} reveal`} aria-label="Ce que disent nos clients" data-station="Avis clients">
      <div className={`container ${styles.head}`}>
        <div>
          <span className="script text-gold">Avis</span>
          <h2 className="section-title">Ce que disent nos clients.</h2>
        </div>
        <div className={styles.summary}>
          <strong>{average.toFixed(1).replace(".", ",")}</strong>
          <span>
            <Stars rating={average} size={16} />
            <small>{items.length} avis client{items.length > 1 ? "s" : ""}</small>
          </span>
        </div>
      </div>

      {band ? (
        <div className={styles.marquee}>
          <div className={styles.track} style={{ ["--d" as string]: `${items.length * 7}s` }}>
            {[0, 1].map((copy) => (
              <div key={copy} className={styles.set}>
                {items.map((t, i) => card(t, `${copy}-${i}`, copy === 1))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={`container ${styles.grid}`}>{items.map((t, i) => card(t, String(i)))}</div>
      )}
    </section>
  )
}
