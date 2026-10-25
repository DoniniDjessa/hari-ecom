import styles from "./WhatsAppChannel.module.css"

/** Band "Rejoignez notre chaîne WhatsApp" (the link of Backoffice › Réseaux et WhatsApp); nothing without it */
export function WhatsAppChannel({ url }: { url: string }) {
  if (!url) return null
  return (
    <section className={`${styles.band} reveal`}>
      <div className={`container ${styles.inner}`}>
        <div>
          <span className="script text-gold">Les premières informées</span>
          <h2>Arrivages, ventes flash, conseils : suivez notre chaîne WhatsApp.</h2>
          <p>Un message de temps en temps, jamais de spam. Vous vous désabonnez quand vous voulez.</p>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-real-gold">Rejoindre la chaîne</a>
      </div>
    </section>
  )
}
