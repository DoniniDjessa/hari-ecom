import type { Metadata } from "next"
import { getSiteContent } from "@/lib/backoffice"
import { SITE } from "@/lib/site"
import { LegalPage } from "@/components/LegalPage"

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: `Comment ${SITE.fullName} utilise et protège vos données personnelles.`,
  alternates: { canonical: "/confidentialite" },
}

export default async function Confidentialite() {
  const { legal } = await getSiteContent()
  const contact = [legal.email, legal.phone || (SITE.whatsapp ? `+${SITE.whatsapp}` : "")].filter(Boolean).join(" ou ")
  return (
    <LegalPage title="Politique de confidentialité" eyebrow="Vos données, protégées" updated="octobre 2026">
      <h2>Qui traite vos données ?</h2>
      <p>{legal.company}{legal.address ? `, ${legal.address}` : ""}, responsable du traitement.</p>

      <h2>Quelles données ?</h2>
      <ul>
        <li><strong>Commande</strong> : nom, numéro de téléphone, lieu de livraison, contenu et note de la commande ;</li>
        <li><strong>Programme Hari Gold</strong> : votre numéro de téléphone, pour retrouver vos commandes livrées ;</li>
        <li><strong>Mesure d&apos;audience</strong> : pages vues et actions sur le site (ajout au panier, commande), de façon statistique ;</li>
        <li>
          <strong>Dans votre navigateur seulement</strong> : panier, favoris, produits vus récemment, résultat du diagnostic
          et thème clair ou sombre. Ces informations ne nous sont pas envoyées.
        </li>
      </ul>

      <h2>Pourquoi ?</h2>
      <p>
        Pour traiter et livrer votre commande, vous rappeler pour la confirmer, calculer vos points de fidélité, et améliorer
        le site. Nous ne vendons jamais vos données et ne les utilisons pas pour de la publicité sans votre accord.
      </p>

      <h2>Combien de temps ?</h2>
      <p>Les données de commande sont conservées le temps nécessaire à la relation commerciale et aux obligations comptables, puis supprimées.</p>

      <h2>Qui y a accès ?</h2>
      <p>
        Uniquement l&apos;équipe Hari Store et, pour la livraison, le livreur (nom, téléphone, adresse). Nos prestataires
        techniques (hébergement, base de données, mesure d&apos;audience) n&apos;y accèdent que pour faire fonctionner le service.
      </p>

      <h2>Vos droits</h2>
      <p>
        Conformément à la loi ivoirienne n° 2013-450 relative à la protection des données à caractère personnel, vous pouvez
        accéder à vos données, les faire rectifier ou supprimer, et vous opposer à leur traitement
        {contact ? <> en nous écrivant : {contact}</> : null}. Vous pouvez aussi saisir l&apos;ARTCI.
      </p>

      <h2>Cookies et stockage local</h2>
      <p>
        Le site utilise le stockage de votre navigateur pour le panier, les favoris et vos préférences, et, si elle est
        activée, une mesure d&apos;audience (Google Analytics). Vous pouvez effacer ces données à tout moment depuis les
        réglages de votre navigateur.
      </p>
    </LegalPage>
  )
}
