import type { Metadata } from "next"
import Link from "next/link"
import { getLoyaltyRules } from "@/lib/loyalty"
import { formatPrice } from "@/lib/site"
import { LoyaltyCheck } from "@/components/LoyaltyCheck"
import styles from "./fidelite.module.css"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Hari Gold : le programme de fidélité",
  description: "Chaque achat chez Hari Store, en ligne ou en boutique, vous rapproche d'un bon d'achat Hari Gold.",
  alternates: { canonical: "/fidelite" },
}

// The rules come from the web app (Paramètres › Hari Gold)
export default async function Fidelite() {
  const r = await getLoyaltyRules()
  const spendForReward = (r.rewardPoints / r.perThousand) * 1000
  const since = new Date(`${r.since}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
  const min = r.minPurchase > 0 ? ` d'au moins ${formatPrice(r.minPurchase)}` : ""
  const unit = r.mode === "amount" ? "points" : "achats"
  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.head}>
        <span className="script text-gold">Programme de fidélité</span>
        <h1>Hari <span>Gold</span>.</h1>
        <p>Chaque achat vous rapproche d&apos;un cadeau. Pas de carte, pas de compte : votre numéro de téléphone suffit.</p>
      </header>

      {!r.active ? (
        <p className={styles.soon}>Le programme ouvre très bientôt : vos achats faits avec votre numéro de téléphone seront pris en compte.</p>
      ) : (
        <>
          <ol className={styles.steps}>
            <li><strong>1</strong><h2>Achetez</h2><p>En ligne ou dans nos boutiques, en donnant votre numéro de téléphone.</p></li>
            <li>
              <strong>2</strong><h2>Cumulez</h2>
              <p>{r.mode === "amount"
                ? `${r.perThousand} point${r.perThousand > 1 ? "s" : ""} pour chaque tranche de 1 000 F, sur chaque achat${min} (commandes livrées et achats payés).`
                : `Chaque achat${min} compte (commandes livrées et achats payés en boutique).`}</p>
            </li>
            <li>
              <strong>3</strong><h2>Profitez</h2>
              <p>{r.mode === "amount"
                ? `${r.rewardPoints} points = un bon de ${formatPrice(r.rewardValue)}, soit dès ${formatPrice(spendForReward)} d'achats.`
                : `${r.rewardPoints} achats = un bon de ${formatPrice(r.rewardValue)}.`}</p>
            </li>
          </ol>

          <section className={styles.check}>
            <h2>Mes {unit}</h2>
            <LoyaltyCheck rewardPoints={r.rewardPoints} rewardValue={r.rewardValue} unit={unit} />
            <p className={styles.small}>
              Achats comptés depuis le {since}. Pour utiliser un bon, signalez-le lors de l&apos;appel de confirmation de votre commande
              ou en caisse. Une question ? <Link href="/livraison-retours">Contactez-nous</Link>.
            </p>
          </section>
        </>
      )}
    </div>
  )
}
