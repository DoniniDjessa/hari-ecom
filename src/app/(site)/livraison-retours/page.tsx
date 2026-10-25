import type { Metadata } from "next"
import { getSiteContent } from "@/lib/backoffice"
import { SITE, whatsappLink } from "@/lib/site"
import { LegalPage } from "@/components/LegalPage"

export const metadata: Metadata = {
  title: "Livraison et retours",
  description: "Livraison partout à Abidjan, paiement à la livraison en espèces ou Mobile Money, produits vérifiés à la réception.",
  alternates: { canonical: "/livraison-retours" },
}

export default async function LivraisonRetours() {
  const { legal, shops } = await getSiteContent()
  return (
    <LegalPage title="Livraison et retours" eyebrow="Simple et sans risque" updated="octobre 2026">
      <h2>Où livrons-nous ?</h2>
      <p>Partout à Abidjan, toutes communes. Pour une livraison hors d&apos;Abidjan, contactez-nous : nous étudions chaque demande.</p>

      <h2>En combien de temps ?</h2>
      <p>
        En général sous <strong>{legal.deliveryDelay}</strong> après la confirmation de votre commande par téléphone. Le
        délai exact vous est donné lors de l&apos;appel.
      </p>

      <h2>Combien ça coûte ?</h2>
      <p>
        Les frais dépendent de votre commune et vous sont annoncés avant l&apos;envoi, lors de l&apos;appel de confirmation :
        vous ne payez rien sans les connaître.
      </p>

      <h2>Comment payer ?</h2>
      <ul>
        <li>À la livraison, en espèces ;</li>
        <li>ou par Mobile Money, à la réception du colis.</li>
      </ul>

      {shops.length > 0 && (
        <>
          <h2>Retrait en boutique</h2>
          <p>Vous pouvez aussi venir chercher vos produits dans nos boutiques : {shops.map((s) => s.name).join(" et ")}.</p>
        </>
      )}

      <h2>Un problème avec votre colis ?</h2>
      <p>
        Vérifiez votre commande devant le livreur. Produit abîmé, erreur ou article manquant : signalez-le-nous dans les{" "}
        <strong>{legal.returnDelay}</strong>
        {SITE.whatsapp ? <> sur <a href={whatsappLink(`Bonjour ${SITE.name}, j'ai un problème avec ma commande.`)} target="_blank" rel="noopener">WhatsApp</a></> : null}
        . Nous le remplaçons ou vous remboursons.
      </p>
      <p>
        Par hygiène, un cosmétique ouvert ou utilisé ne peut être ni repris ni échangé, sauf défaut du produit. Un doute
        sur le bon soin ? Demandez conseil avant de commander : nos conseillères vous répondent.
      </p>
    </LegalPage>
  )
}
