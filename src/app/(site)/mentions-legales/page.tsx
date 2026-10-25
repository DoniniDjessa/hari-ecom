import type { Metadata } from "next"
import { getSiteContent } from "@/lib/backoffice"
import { SITE } from "@/lib/site"
import { Facts, LegalPage } from "@/components/LegalPage"

export const metadata: Metadata = {
  title: "Mentions légales",
  description: `Mentions légales du site ${SITE.fullName} : éditeur, hébergeur, propriété intellectuelle.`,
  alternates: { canonical: "/mentions-legales" },
}

export default async function MentionsLegales() {
  const { legal, shops } = await getSiteContent()
  return (
    <LegalPage title="Mentions légales" eyebrow="Informations" updated="octobre 2026">
      <h2>Éditeur du site</h2>
      <p>Le site <strong>{SITE.url.replace(/^https?:\/\//, "")}</strong> est édité par :</p>
      <Facts items={[
        ["Raison sociale", legal.company],
        ["Forme juridique", legal.legalForm],
        ["RCCM", legal.rccm],
        ["Compte contribuable (NCC)", legal.ncc],
        ["Siège", legal.address],
        ["Téléphone", legal.phone || (SITE.whatsapp ? `+${SITE.whatsapp}` : "")],
        ["E-mail", legal.email],
        ["Responsable de la publication", legal.director],
      ]} />
      {shops.length > 0 && <p>Nos boutiques : {shops.map((s) => `${s.name} (${s.city})`).join(", ")}.</p>}

      <h2>Hébergement</h2>
      {legal.host ? <p>{legal.host}</p> : <p>Le site est hébergé par un prestataire professionnel ; ses coordonnées sont disponibles sur simple demande.</p>}

      <h2>Propriété intellectuelle</h2>
      <p>
        Les textes, photographies, logos, illustrations et la présentation du site sont la propriété de {legal.company} ou
        de ses partenaires. Toute reproduction, totale ou partielle, sans autorisation écrite préalable est interdite. Les
        marques des produits vendus appartiennent à leurs titulaires respectifs.
      </p>

      <h2>Responsabilité</h2>
      <p>
        Nous veillons à l&apos;exactitude des informations publiées (descriptions, prix, disponibilités). Les photos des
        produits sont présentées à titre illustratif ; en cas de différence avec le produit livré, l&apos;emballage et la
        notice du fabricant font foi. Les conseils donnés sur le site ne remplacent pas l&apos;avis d&apos;un médecin ou
        d&apos;un dermatologue.
      </p>

      <h2>Données personnelles</h2>
      <p>Le traitement de vos données est décrit dans notre <a href="/confidentialite">politique de confidentialité</a>.</p>
    </LegalPage>
  )
}
