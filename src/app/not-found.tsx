import Link from "next/link"

export default function NotFound() {
  return (
    <div className="container" style={{ padding: "100px 20px", textAlign: "center" }}>
      <span className="eyebrow">Page introuvable</span>
      <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.4rem)", margin: "12px 0 14px" }}>Ce soin n&apos;est plus ici</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 28 }}>Il a peut-être été retiré du site. Retrouvez toute notre sélection dans la boutique.</p>
      <Link href="/boutique" className="btn btn-dark">Aller à la boutique</Link>
    </div>
  )
}
