"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { listImages, logout, saveContent } from "@/app/backoffice/actions"
import { DEFAULT_CONTENT, MAX_POSTERS, MAX_SHOPS, mergeContent, MAX_TESTIMONIALS, type Poster, type Shop, type SiteContent, type Testimonial } from "@/lib/content"
import { ThemeToggle } from "../ThemeToggle"
import styles from "./Backoffice.module.css"

// The backoffice, with the imo-platform look (Phoenix): side menu by section, top bar with the save,
// compact cards with small labels, tables for the posters and the universes. A text field left empty
// shows the default text (in grey). Images are reduced in the browser (1800 px max, WebP) before upload.
// Nothing is lost on a cut connection: every change is kept as a draft in the browser (offered back on the
// next visit), a save never overwrites a newer one, and every image ever sent can be picked again.

const DRAFT = "hari-bo-draft"
type Draft = { content: SiteContent; at: string }
const readDraft = (): Draft | null => {
  try { return JSON.parse(localStorage.getItem(DRAFT) || "null") } catch { return null }
}
const writeDraft = (d: Draft | null) => {
  try { if (d) localStorage.setItem(DRAFT, JSON.stringify(d)); else localStorage.removeItem(DRAFT) } catch {}
}

// images already sent, loaded for the pickers
let gallery: Promise<{ src: string; at: string }[]> | null = null
const loadGallery = (fresh = false) => {
  if (!gallery || fresh) gallery = listImages().catch((e) => { gallery = null; throw e })
  return gallery
}

type Section = Exclude<keyof SiteContent, "universes" | "posters" | "testimonials" | "shops">
type Field = { key: string; label: string; long?: boolean; image?: boolean; half?: boolean }
type View = "overview" | "posters" | "universes" | "testimonials" | "shops" | Section

const SECTIONS: { id: Section; title: string; hint: string; fields: Field[] }[] = [
  {
    id: "hero", title: "Diapositive de marque", hint: "En haut de l'accueil tant qu'il n'y a aucune affiche.",
    fields: [
      { key: "eyebrow", label: "Ligne manuscrite (or)", half: true },
      { key: "cta", label: "Texte du bouton", half: true },
      { key: "title", label: "Titre", half: true },
      { key: "subtitle", label: "Sous-titre", half: true },
      { key: "text", label: "Texte", long: true },
      { key: "image", label: "Image (à droite ; sans image, le logo)", image: true },
    ],
  },
  {
    id: "about", title: "Qui sommes-nous", hint: "Le bloc éditorial de l'accueil.",
    fields: [
      { key: "eyebrow", label: "Ligne manuscrite (or)", half: true },
      { key: "title", label: "Titre", half: true },
      { key: "text", label: "Texte (il s'éclaire mot à mot au défilement)", long: true },
      { key: "image", label: "Photo (sans photo, le logo)", image: true },
    ],
  },
  {
    id: "packs", title: "Nos packs", hint: "L'en-tête de la page Nos packs et du bloc de l'accueil.",
    fields: [
      { key: "eyebrow", label: "Ligne manuscrite (or)", half: true },
      { key: "title", label: "Titre", half: true },
      { key: "text", label: "Texte", long: true },
    ],
  },
  {
    id: "advice", title: "Bandeau conseil", hint: "Le bandeau noir en bas de l'accueil.",
    fields: [
      { key: "eyebrow", label: "Ligne manuscrite (or)", half: true },
      { key: "title", label: "Titre", half: true },
      { key: "text", label: "Texte", long: true },
    ],
  },
  {
    id: "footer", title: "Pied de page", hint: "En bas de toutes les pages.",
    fields: [
      { key: "description", label: "Présentation", long: true },
      { key: "signature", label: "Signature manuscrite (or)", half: true },
    ],
  },
]

const NAV: { label: string; items: { id: View; title: string; icon: string }[] }[] = [
  { label: "Général", items: [{ id: "overview", title: "Vue d'ensemble", icon: "◎" }] },
  { label: "Accueil", items: [
    { id: "posters", title: "Affiches du carrousel", icon: "▤" },
    { id: "hero", title: "Diapositive de marque", icon: "✦" },
    { id: "universes", title: "Nos univers", icon: "◐" },
    { id: "about", title: "Qui sommes-nous", icon: "❝" },
    { id: "advice", title: "Bandeau conseil", icon: "✉" },
    { id: "testimonials", title: "Avis clients", icon: "★" },
    { id: "shops", title: "Nos boutiques", icon: "⌖" },
  ] },
  { label: "Pages", items: [
    { id: "packs", title: "Nos packs", icon: "❖" },
    { id: "footer", title: "Pied de page", icon: "▁" },
  ] },
]

/** Reduces a photo to 1800 px max and re-encodes it in WebP (keeps the original if that is not smaller) */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
    const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.9))
    return blob && blob.type === "image/webp" && blob.size < file.size ? blob : file
  } catch {
    return file
  }
}

/** Image picker: the thumbnail is the button; `width` sets its size (table cells) */
function ImageField({ value, onChange, round, ratio = "4 / 3", width = 220 }: {
  value: string
  onChange: (v: string) => void
  round?: boolean
  ratio?: string
  width?: number
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [library, setLibrary] = useState<{ src: string; at: string }[] | null>(null)
  const [open, setOpen] = useState(false)

  const browse = async () => {
    setOpen(true)
    setError("")
    try {
      setLibrary(await loadGallery(true))
    } catch {
      setOpen(false)
      setError("Galerie indisponible (connexion ?).")
    }
  }

  const pick = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError("")
    try {
      const body = new FormData()
      body.append("file", await shrink(file), file.name)
      const res = await fetch("/api/backoffice/upload", { method: "POST", body })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Échec de l'envoi.")
      onChange(data.src)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'envoi.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.imageField}>
      <button
        type="button"
        className={`${styles.thumb} ${round ? styles.thumbRound : ""}`}
        style={{ width, aspectRatio: round ? "1" : ratio }}
        onClick={() => input.current?.click()}
        disabled={busy}
        title={value ? "Changer l'image" : "Choisir une image"}
      >
        {value ? <Image src={value} alt="" fill sizes={`${width}px`} /> : <span>{busy ? "Envoi…" : "+ Image"}</span>}
        {busy && value && <span className={styles.thumbBusy}>Envoi…</span>}
      </button>
      <button type="button" className={styles.linkMuted} onClick={browse} disabled={busy}>Images envoyées</button>
      {value && !busy && <button type="button" className={styles.linkDanger} onClick={() => onChange("")}>Retirer</button>}
      {error && <span className={styles.fieldError}>{error}</span>}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = "" }} />
      {open && (
        <div className={styles.galleryScrim} onClick={() => setOpen(false)}>
          <div className={styles.gallery} role="dialog" aria-label="Images envoyées" onClick={(e) => e.stopPropagation()}>
            <div className={styles.galleryHead}>
              <h3>Images envoyées</h3>
              <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setOpen(false)}>Fermer</button>
            </div>
            {!library ? (
              <p className={styles.galleryNote}>Chargement…</p>
            ) : !library.length ? (
              <p className={styles.galleryNote}>Aucune image envoyée pour l&apos;instant.</p>
            ) : (
              <div className={styles.galleryGrid}>
                {library.map((img) => (
                  <button key={img.src} type="button" className={`${styles.galleryItem} ${img.src === value ? styles.galleryOn : ""}`}
                    onClick={() => { onChange(img.src); setOpen(false) }} title={new Date(img.at).toLocaleString("fr-FR")}>
                    <Image src={img.src} alt="" fill sizes="140px" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function BackofficeEditor({ initial, version: initialVersion, universes }: {
  initial: SiteContent
  /** date of the save the page was loaded with */
  version: string | null
  universes: { name: string; slug: string; tagline: string }[]
}) {
  const [content, setContent] = useState(initial)
  const [saved, setSaved] = useState(JSON.stringify(initial))
  const [version, setVersion] = useState(initialVersion)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string; conflict?: boolean } | null>(null)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<View>("overview")
  const [menu, setMenu] = useState(false)
  const dirty = JSON.stringify(content) !== saved

  // leaving with unsaved changes: the browser asks first
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  // a draft left by a visit that could not save: offered back
  useEffect(() => {
    const d = readDraft()
    if (d && JSON.stringify(mergeContent(d.content)) !== saved) setDraft(d)
    else writeDraft(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // every change is kept in the browser until it is saved
  useEffect(() => {
    if (draft) return // not while a draft waits for an answer
    if (dirty) writeDraft({ content, at: new Date().toISOString() })
    else writeDraft(null)
  }, [content, dirty, draft])

  useEffect(() => {
    if (status?.kind !== "ok") return
    const t = setTimeout(() => setStatus(null), 3500)
    return () => clearTimeout(t)
  }, [status])

  const set = (section: Section, key: string, value: string) =>
    setContent((c) => ({ ...c, [section]: { ...c[section], [key]: value } }))
  const setUniverse = (slug: string, key: "tagline" | "image", value: string) =>
    setContent((c) => ({ ...c, universes: { ...c.universes, [slug]: { ...(c.universes[slug] ?? { tagline: "", image: "" }), [key]: value } } }))

  const posters = content.posters
  const setPosters = (next: Poster[]) => setContent((c) => ({ ...c, posters: next }))
  const setPoster = (i: number, key: keyof Poster, value: string | boolean) => setPosters(posters.map((p, k) => (k === i ? { ...p, [key]: value } : p)))
  const movePoster = (i: number, d: -1 | 1) => {
    const next = [...posters]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    setPosters(next)
  }

  // reviews: add, change, move, remove
  const reviews = content.testimonials
  const setReviews = (next: Testimonial[]) => setContent((c) => ({ ...c, testimonials: next }))
  const setReview = (i: number, key: keyof Testimonial, value: string | number) =>
    setReviews(reviews.map((r, k) => (k === i ? { ...r, [key]: value } : r)))
  const moveReview = (i: number, d: -1 | 1) => {
    const next = [...reviews]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    setReviews(next)
  }

  // shops: add, change, move, remove; coordinates pasted from Google Maps ("5.3599, -3.9871") fill both fields
  const shops = content.shops
  const setShops = (next: Shop[]) => setContent((c) => ({ ...c, shops: next }))
  const setShop = (i: number, patch: Partial<Shop>) => setShops(shops.map((s, k) => (k === i ? { ...s, ...patch } : s)))
  const setCoord = (i: number, key: "lat" | "lng", raw: string) => {
    const pair = raw.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/)
    if (pair) return setShop(i, { lat: Number(pair[1]), lng: Number(pair[2]) })
    // kept as typed while it is not a whole number yet ("5.", "-"): the save turns it into a number
    setShop(i, { [key]: (String(Number(raw)) === raw ? Number(raw) : raw) as unknown as number })
  }
  const moveShop = (i: number, d: -1 | 1) => {
    const next = [...shops]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    setShops(next)
  }

  const save = async () => {
    setSaving(true)
    const result = await saveContent(content, version).catch(() => ({ ok: false as const, error: "Connexion perdue : vos modifications sont gardées, réessayez." }))
    setSaving(false)
    if (!result.ok) return setStatus({ kind: "error", text: result.error, conflict: "conflict" in result && result.conflict })
    setVersion(result.version)
    setSaved(JSON.stringify(content))
    writeDraft(null)
    setStatus({ kind: "ok", text: "Enregistré : le site est à jour." })
  }

  const go = (v: View) => {
    setView(v)
    setMenu(false)
    window.scrollTo({ top: 0 })
  }
  const title = NAV.flatMap((g) => g.items).find((i) => i.id === view)?.title ?? ""
  const textOf = (s: Section, k: string) => (content[s] as Record<string, string>)[k] ?? ""
  const defaultOf = (s: Section, k: string) => (DEFAULT_CONTENT[s] as Record<string, string>)[k] ?? ""
  const universesWithImage = universes.filter((u) => content.universes[u.slug]?.image).length
  const customTexts = SECTIONS.reduce((n, s) => n + s.fields.filter((f) => !f.image && textOf(s.id, f.key) && textOf(s.id, f.key) !== defaultOf(s.id, f.key)).length, 0)
  const section = SECTIONS.find((s) => s.id === view)
  const hint = view === "overview"
    ? "Les textes et les images du site. Les produits, les prix et les packs se gèrent dans la web app."
    : view === "posters"
      ? "Les affiches défilent en haut de l'accueil, dans cet ordre. Une affiche sans image n'est pas enregistrée."
      : view === "universes"
        ? "L'image ronde s'affiche au centre de la tuile de l'univers. Une image carrée rend le mieux."
        : view === "shops"
          ? "« Nos boutiques » sur l'accueil (carte Google), le pied de page et le menu. Sans boutique, la section n'apparaît pas."
        : view === "testimonials"
          ? "« Ce que disent nos clients », en bas de l'accueil. Uniquement de vrais avis, avec l'accord du client. Sans avis, la section n'apparaît pas."
        : section?.hint

  return (
    <div className={styles.app}>
      {/* ---------- side menu ---------- */}
      <aside className={`${styles.sidebar} ${menu ? styles.sidebarOpen : ""}`}>
        <div className={styles.sideBrand}>
          <Image src="/haristore-mark.png" alt="" width={34} height={22} />
          <span><strong>Hari Store</strong><small>Backoffice du site</small></span>
        </div>
        <nav className={styles.sideNav}>
          {NAV.map((g) => (
            <div key={g.label} className={styles.navSection}>
              <p className={styles.navLabel}>{g.label}</p>
              {g.items.map((it) => (
                <button key={it.id} type="button" className={`${styles.navItem} ${view === it.id ? styles.navActive : ""}`} onClick={() => go(it.id)}>
                  <span className={styles.navIcon} aria-hidden="true">{it.icon}</span>
                  {it.title}
                  {it.id === "posters" && <span className={styles.navCount}>{posters.length}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className={styles.sideFoot}>
          <ThemeToggle labelled />
          <form action={logout}><button type="submit" className={`${styles.btn} ${styles.btnGhost} ${styles.btnBlock}`}>Déconnexion</button></form>
        </div>
      </aside>
      {menu && <div className={styles.scrim} onClick={() => setMenu(false)} />}

      <div className={styles.main}>
        {/* ---------- top bar ---------- */}
        <header className={styles.topbar}>
          <div className={styles.topLeft}>
            <button type="button" className={styles.menuBtn} onClick={() => setMenu(true)} aria-label="Menu">☰</button>
            <span className={styles.crumbs}>Backoffice <i>/</i> <b>{title}</b></span>
          </div>
          <div className={styles.topRight}>
            {status ? (
              <>
                <span className={status.kind === "ok" ? styles.badgeOk : styles.badgeError}>{status.text}</span>
                {/* the draft is kept in the browser: after the reload, "Restaurer" brings the changes back */}
                {status.conflict && <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => window.location.reload()}>Recharger</button>}
              </>
            ) : dirty ? (
              <span className={styles.badgeWarn}>Non enregistré</span>
            ) : null}
            <Link href="/" target="_blank" className={`${styles.btn} ${styles.btnSecondary} ${styles.hideSm}`}>Voir le site ↗</Link>
            {dirty && <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setContent(JSON.parse(saved))} disabled={saving}>Annuler</button>}
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={save} disabled={!dirty || saving}>{saving ? "Enregistrement…" : "Enregistrer"}</button>
          </div>
        </header>

        <main className={styles.content}>
          {draft && (
            <div className={styles.draftBar}>
              <span>Des modifications non enregistrées du {new Date(draft.at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })} ont été retrouvées.</span>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => { setContent(mergeContent(draft.content)); setDraft(null) }}>Restaurer</button>
              <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => { writeDraft(null); setDraft(null) }}>Ignorer</button>
            </div>
          )}
          <div className={styles.pageHead}>
            <h1>{title}</h1>
            <p>{hint}</p>
          </div>

          {view === "overview" && (
            <>
              <div className={styles.kpis}>
                <button type="button" className={styles.kpi} onClick={() => go("posters")}>
                  <span className={styles.kpiIcon}>▤</span>
                  <span className={styles.kpiText}><strong>{posters.length}<small> / {MAX_POSTERS}</small></strong><span>Affiches du carrousel</span></span>
                </button>
                <button type="button" className={styles.kpi} onClick={() => go("universes")}>
                  <span className={styles.kpiIcon}>◐</span>
                  <span className={styles.kpiText}><strong>{universesWithImage}<small> / {universes.length}</small></strong><span>Univers avec image ronde</span></span>
                </button>
                <div className={styles.kpi}>
                  <span className={styles.kpiIcon}>✎</span>
                  <span className={styles.kpiText}><strong>{customTexts}</strong><span>Textes personnalisés</span></span>
                </div>
              </div>
              <div className={styles.card}>
                <div className={styles.cardHead}><h2>Sections du site</h2></div>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead><tr><th>Section</th><th>Emplacement</th><th>État</th><th className={styles.right} /></tr></thead>
                    <tbody>
                      <tr>
                        <td><b>Affiches du carrousel</b></td><td>Accueil, en haut</td>
                        <td>{posters.length ? <span className={styles.badgeOk}>{posters.length} affiche{posters.length > 1 ? "s" : ""}</span> : <span className={styles.badgeNeutral}>Diapositive de marque</span>}</td>
                        <td className={styles.right}><button type="button" className={`${styles.btn} ${styles.btnSm} ${styles.btnSecondary}`} onClick={() => go("posters")}>Modifier</button></td>
                      </tr>
                      {SECTIONS.map((s) => {
                        const edited = s.fields.some((f) => textOf(s.id, f.key) !== defaultOf(s.id, f.key))
                        return (
                          <tr key={s.id}>
                            <td><b>{s.title}</b></td><td>{s.hint}</td>
                            <td>{edited ? <span className={styles.badgeOk}>Personnalisé</span> : <span className={styles.badgeNeutral}>D&apos;origine</span>}</td>
                            <td className={styles.right}><button type="button" className={`${styles.btn} ${styles.btnSm} ${styles.btnSecondary}`} onClick={() => go(s.id)}>Modifier</button></td>
                          </tr>
                        )
                      })}
                      <tr>
                        <td><b>Avis clients</b></td><td>Accueil, au-dessus du pied de page</td>
                        <td>{reviews.length ? <span className={styles.badgeOk}>{reviews.length} avis</span> : <span className={styles.badgeNeutral}>Masqué (aucun avis)</span>}</td>
                        <td className={styles.right}><button type="button" className={`${styles.btn} ${styles.btnSm} ${styles.btnSecondary}`} onClick={() => go("testimonials")}>Modifier</button></td>
                      </tr>
                      <tr>
                        <td><b>Nos univers</b></td><td>Accueil, tuiles des univers</td>
                        <td><span className={universesWithImage ? styles.badgeOk : styles.badgeNeutral}>{universesWithImage} image{universesWithImage > 1 ? "s" : ""}</span></td>
                        <td className={styles.right}><button type="button" className={`${styles.btn} ${styles.btnSm} ${styles.btnSecondary}`} onClick={() => go("universes")}>Modifier</button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {view === "posters" && (
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h2>Affiches <span className={styles.muted}>{posters.length} / {MAX_POSTERS}</span></h2>
                {posters.length < MAX_POSTERS && (
                  <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} onClick={() => setPosters([...posters, { image: "", mobile: "", link: "", label: "", brandText: true }])}>
                    + Ajouter une affiche
                  </button>
                )}
              </div>
              <p className={styles.cardHint}>Ordinateur : 1920 × 900 px. Téléphone : 1080 × 1350 px (facultatif, sinon l&apos;affiche ordinateur).</p>
              {posters.length === 0 ? (
                <p className={styles.empty}>Aucune affiche : l&apos;accueil montre la diapositive de marque.</p>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead><tr><th>#</th><th>Ordinateur</th><th>Téléphone</th><th>Lien</th><th>Bouton</th><th>Textes de la marque</th><th className={styles.right}>Actions</th></tr></thead>
                    <tbody>
                      {posters.map((p, i) => (
                        <tr key={i}>
                          <td className={styles.num}>{i + 1}</td>
                          <td><ImageField value={p.image} onChange={(v) => setPoster(i, "image", v)} ratio="32 / 15" width={150} /></td>
                          <td><ImageField value={p.mobile} onChange={(v) => setPoster(i, "mobile", v)} ratio="4 / 5" width={56} /></td>
                          <td><input className={styles.input} value={p.link} placeholder="/packs" onChange={(e) => setPoster(i, "link", e.target.value)} /></td>
                          <td><input className={styles.input} value={p.label} placeholder="Découvrir" onChange={(e) => setPoster(i, "label", e.target.value)} /></td>
                          <td>
                            {/* off for a poster that already carries its own text */}
                            <button type="button" role="switch" aria-checked={p.brandText} className={`${styles.switch} ${p.brandText ? styles.switchOn : ""}`}
                              onClick={() => setPoster(i, "brandText", !p.brandText)} title="Les textes de la « Diapositive de marque » sur l'affiche">
                              <span className={styles.switchKnob} />
                              <span>{p.brandText ? "Par-dessus" : "En dessous"}</span>
                            </button>
                          </td>
                          <td className={styles.right}>
                            <div className={styles.rowActions}>
                              <button type="button" className={styles.iconBtn} onClick={() => movePoster(i, -1)} disabled={i === 0} aria-label="Monter">↑</button>
                              <button type="button" className={styles.iconBtn} onClick={() => movePoster(i, 1)} disabled={i === posters.length - 1} aria-label="Descendre">↓</button>
                              <button type="button" className={`${styles.iconBtn} ${styles.iconDanger}`} onClick={() => setPosters(posters.filter((_, k) => k !== i))} aria-label="Retirer">✕</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {view === "testimonials" && (
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h2>Avis <span className={styles.muted}>{reviews.length} / {MAX_TESTIMONIALS}</span></h2>
                {reviews.length < MAX_TESTIMONIALS && (
                  <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
                    onClick={() => setReviews([...reviews, { name: "", city: "", text: "", rating: 5, product: "" }])}>
                    + Ajouter un avis
                  </button>
                )}
              </div>
              <p className={styles.cardHint}>Un avis sans nom ou sans texte n&apos;est pas enregistré. À partir de 4 avis, ils défilent en bandeau.</p>
              {reviews.length === 0 ? (
                <p className={styles.empty}>Aucun avis : la section n&apos;apparaît pas sur le site.</p>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead><tr><th>#</th><th>Client</th><th>Note</th><th>Avis</th><th>Produit (facultatif)</th><th className={styles.right}>Actions</th></tr></thead>
                    <tbody>
                      {reviews.map((r, i) => (
                        <tr key={i}>
                          <td className={styles.num}>{i + 1}</td>
                          <td>
                            <div className={styles.stack}>
                              <input className={styles.input} value={r.name} placeholder="Prénom N." maxLength={60} onChange={(e) => setReview(i, "name", e.target.value)} />
                              <input className={styles.input} value={r.city} placeholder="Commune (facultatif)" maxLength={60} onChange={(e) => setReview(i, "city", e.target.value)} />
                            </div>
                          </td>
                          <td>
                            <select className={styles.input} value={r.rating} onChange={(e) => setReview(i, "rating", Number(e.target.value))} aria-label="Note">
                              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}
                            </select>
                          </td>
                          <td className={styles.wideCell}>
                            <textarea className={styles.input} rows={3} value={r.text} maxLength={600} placeholder="Ce que le client a dit…" onChange={(e) => setReview(i, "text", e.target.value)} />
                          </td>
                          <td><input className={styles.input} value={r.product} maxLength={120} placeholder="Ex. Lait Gluta-C" onChange={(e) => setReview(i, "product", e.target.value)} /></td>
                          <td className={styles.right}>
                            <div className={styles.rowActions}>
                              <button type="button" className={styles.iconBtn} onClick={() => moveReview(i, -1)} disabled={i === 0} aria-label="Monter">↑</button>
                              <button type="button" className={styles.iconBtn} onClick={() => moveReview(i, 1)} disabled={i === reviews.length - 1} aria-label="Descendre">↓</button>
                              <button type="button" className={`${styles.iconBtn} ${styles.iconDanger}`} onClick={() => setReviews(reviews.filter((_, k) => k !== i))} aria-label="Retirer">✕</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {view === "shops" && (
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h2>Boutiques <span className={styles.muted}>{shops.length} / {MAX_SHOPS}</span></h2>
                {shops.length < MAX_SHOPS && (
                  <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
                    onClick={() => setShops([...shops, { name: "", city: "", lat: 5.3364, lng: -4.0267 }])}>
                    + Ajouter une boutique
                  </button>
                )}
              </div>
              <p className={styles.cardHint}>
                Coordonnées : dans Google Maps, clic droit sur la boutique (appui long sur téléphone), copiez les chiffres
                (ex. 5.3599, -3.9871) et collez-les dans Latitude : les deux champs se remplissent. Une boutique sans nom n&apos;est pas enregistrée.
              </p>
              {shops.length === 0 ? (
                <p className={styles.empty}>Aucune boutique : la section n&apos;apparaît pas sur le site.</p>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead><tr><th>#</th><th>Boutique</th><th>Latitude</th><th>Longitude</th><th>Vérifier</th><th className={styles.right}>Actions</th></tr></thead>
                    <tbody>
                      {shops.map((s, i) => (
                        <tr key={i}>
                          <td className={styles.num}>{i + 1}</td>
                          <td>
                            <div className={styles.stack}>
                              <input className={styles.input} value={s.name} placeholder="Hari Store Cocody" maxLength={60} onChange={(e) => setShop(i, { name: e.target.value })} />
                              <input className={styles.input} value={s.city} placeholder="Commune, Abidjan" maxLength={60} onChange={(e) => setShop(i, { city: e.target.value })} />
                            </div>
                          </td>
                          <td><input className={styles.input} inputMode="decimal" value={String(s.lat)} placeholder="5.3599" onChange={(e) => setCoord(i, "lat", e.target.value)} /></td>
                          <td><input className={styles.input} inputMode="decimal" value={String(s.lng)} placeholder="-3.9871" onChange={(e) => setCoord(i, "lng", e.target.value)} /></td>
                          <td><a className={styles.linkMuted} href={`https://www.google.com/maps?q=${s.lat},${s.lng}`} target="_blank" rel="noopener">Voir sur la carte ↗</a></td>
                          <td className={styles.right}>
                            <div className={styles.rowActions}>
                              <button type="button" className={styles.iconBtn} onClick={() => moveShop(i, -1)} disabled={i === 0} aria-label="Monter">↑</button>
                              <button type="button" className={styles.iconBtn} onClick={() => moveShop(i, 1)} disabled={i === shops.length - 1} aria-label="Descendre">↓</button>
                              <button type="button" className={`${styles.iconBtn} ${styles.iconDanger}`} onClick={() => setShops(shops.filter((_, k) => k !== i))} aria-label="Retirer">✕</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {view === "universes" && (
            <div className={styles.card}>
              <div className={styles.cardHead}><h2>Univers <span className={styles.muted}>{universesWithImage} / {universes.length} avec image</span></h2></div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Image ronde</th><th>Univers</th><th>Phrase d&apos;accroche</th></tr></thead>
                  <tbody>
                    {universes.map((u) => {
                      const v = content.universes[u.slug] ?? { tagline: "", image: "" }
                      return (
                        <tr key={u.slug}>
                          <td><ImageField value={v.image} onChange={(x) => setUniverse(u.slug, "image", x)} round width={56} /></td>
                          <td><b>{u.name}</b></td>
                          <td className={styles.wideCell}><input className={styles.input} value={v.tagline} placeholder={u.tagline} onChange={(e) => setUniverse(u.slug, "tagline", e.target.value)} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section && (
            <div className={styles.card}>
              <div className={styles.cardHead}><h2>{section.title}</h2></div>
              <div className={styles.form}>
                {section.fields.map((f) => f.image ? (
                  <div key={f.key} className={`${styles.field} ${styles.full}`}>
                    <span className={styles.label}>{f.label}</span>
                    <ImageField value={textOf(section.id, f.key)} onChange={(v) => set(section.id, f.key, v)} />
                  </div>
                ) : (
                  <label key={f.key} className={`${styles.field} ${f.half ? "" : styles.full}`}>
                    <span className={styles.label}>{f.label}</span>
                    {f.long ? (
                      <textarea className={styles.input} rows={4} value={textOf(section.id, f.key)} placeholder={defaultOf(section.id, f.key)} onChange={(e) => set(section.id, f.key, e.target.value)} />
                    ) : (
                      <input className={styles.input} value={textOf(section.id, f.key)} placeholder={defaultOf(section.id, f.key)} onChange={(e) => set(section.id, f.key, e.target.value)} />
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
