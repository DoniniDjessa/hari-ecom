import type { Metadata } from "next"
import { getSiteContent } from "@/lib/backoffice"
import { SITE } from "@/lib/site"
import { LegalPage } from "@/components/LegalPage"

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  description: `Conditions générales de vente de ${SITE.fullName} : commande, prix, livraison à Abidjan, paiement à la livraison, retours.`,
  alternates: { canonical: "/cgv" },
}

export default async function Cgv() {
  const { legal } = await getSiteContent()
  const contact = [legal.phone || (SITE.whatsapp ? `+${SITE.whatsapp} (WhatsApp)` : ""), legal.email].filter(Boolean).join(" · ")
  return (
    <LegalPage title="Conditions générales de vente" eyebrow="En toute transparence" updated="octobre 2026">
      <h2>1. Objet</h2>
      <p>
        Les présentes conditions régissent les ventes conclues sur le site {SITE.url.replace(/^https?:\/\//, "")} entre{" "}
        {legal.company} (« Hari Store ») et toute personne passant commande (« le client »). Passer commande vaut
        acceptation de ces conditions.
      </p>

      <h2>2. Produits</h2>
      <p>
        Les produits sont des cosmétiques et produits de bien-être authentiques, sélectionnés dans nos boutiques. Leurs
        caractéristiques essentielles sont présentées sur chaque fiche. Les photos sont illustratives ; l&apos;emballage du
        fabricant fait foi. Les offres valent dans la limite des stocks disponibles.
      </p>

      <h2>3. Prix</h2>
      <p>
        Les prix sont indiqués en francs CFA (FCFA), toutes taxes comprises, hors frais de livraison. Les prix promotionnels
        (prix barrés, ventes flash) valent pendant la durée affichée. Le prix appliqué est celui en vigueur au moment de la
        commande.
      </p>

      <h2>4. Commande</h2>
      <p>
        Le client ajoute les produits à son panier puis valide sa commande en indiquant son nom, son numéro de téléphone et
        son lieu de livraison. Une conseillère l&apos;appelle ensuite pour confirmer la commande, le délai et les frais de
        livraison. La vente est conclue à cette confirmation. Hari Store peut refuser une commande anormale ou
        présentant un risque (informations erronées, quantités inhabituelles).
      </p>

      <h2>5. Livraison</h2>
      <p>
        Nous livrons partout à Abidjan, en général sous {legal.deliveryDelay} après confirmation. Les frais dépendent de la
        commune et sont annoncés avant l&apos;envoi. Le détail figure dans notre page{" "}
        <a href="/livraison-retours">Livraison et retours</a>.
      </p>

      <h2>6. Paiement</h2>
      <p>
        Le paiement se fait à la livraison, en espèces ou par Mobile Money, à réception du colis. Aucun paiement n&apos;est
        demandé sur le site.
      </p>

      <h2>7. Réclamations et retours</h2>
      <p>
        Vérifiez votre colis à la livraison. Pour un produit endommagé, non conforme ou manquant, contactez-nous dans les{" "}
        {legal.returnDelay} suivant la réception : nous le remplaçons ou le remboursons. Pour des raisons d&apos;hygiène, un
        produit cosmétique ouvert ou utilisé ne peut être ni repris ni échangé, sauf défaut.
      </p>

      <h2>8. Utilisation des produits</h2>
      <p>
        Respectez le mode d&apos;emploi et les précautions du fabricant. Faites un essai sur une petite zone de peau avant
        une première utilisation. En cas de réaction, cessez l&apos;usage et consultez un professionnel de santé.
      </p>

      <h2>9. Données personnelles</h2>
      <p>Vos informations servent uniquement à traiter votre commande : voir la <a href="/confidentialite">politique de confidentialité</a>.</p>

      <h2>10. Litiges</h2>
      <p>
        Les présentes conditions sont soumises au droit ivoirien. En cas de différend, nous recherchons d&apos;abord une
        solution amiable{contact ? ` (${contact})` : ""} ; à défaut, les tribunaux d&apos;Abidjan sont compétents.
      </p>
    </LegalPage>
  )
}
