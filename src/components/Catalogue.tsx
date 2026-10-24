"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import type { CardProduct } from "@/lib/types"
import { formatPrice, UNIVERSES } from "@/lib/site"
import { ProductCard } from "./ProductCard"
import { StarIcon, CloseIcon, FilterIcon, SearchIcon } from "./icons"
import styles from "./Catalogue.module.css"

const SORTS = [
  { id: "", label: "Recommandés" },
  { id: "ventes", label: "Meilleures ventes" },
  { id: "nouveautes", label: "Nouveautés" },
  { id: "prix-asc", label: "Prix croissant" },
  { id: "prix-desc", label: "Prix décroissant" },
  { id: "notes", label: "Mieux notés" },
]
const PAGE = 24
/** options shown before "Voir plus" in a group */
const FIRST = 8

const PRICES: { label: string; min: number | null; max: number | null }[] = [
  { label: "Moins de 5 000 F", min: null, max: 5000 },
  { label: "5 000 à 10 000 F", min: 5000, max: 10000 },
  { label: "10 000 à 20 000 F", min: 10000, max: 20000 },
  { label: "Plus de 20 000 F", min: 20000, max: null },
]

const SELECTIONS = [
  { id: "new", label: "Nouveautés", test: (p: CardProduct) => p.isNew },
  { id: "bestseller", label: "Meilleures ventes", test: (p: CardProduct) => p.bestseller },
  { id: "featured", label: "Coups de cœur", test: (p: CardProduct) => p.featured },
  { id: "lot", label: "Offres par lot", test: (p: CardProduct) => !!p.lot },
] as const

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

type ListKey = "forms" | "benefits" | "skins" | "hairs" | "targets" | "brands" | "selections"
type Filters = Record<ListKey, string[]> & { inStock: boolean; min: number | null; max: number | null; rating: number | null }
const NO_FILTERS: Filters = {
  forms: [], benefits: [], skins: [], hairs: [], targets: [], brands: [], selections: [],
  inStock: false, min: null, max: null, rating: null,
}

// the values a product has for each list filter
const VALUES: Record<ListKey, (p: CardProduct) => string[]> = {
  forms: (p) => [p.form],
  benefits: (p) => p.benefits,
  skins: (p) => p.skinTypes,
  hairs: (p) => p.hairTypes,
  targets: (p) => p.targets,
  brands: (p) => [p.brand],
  selections: (p) => SELECTIONS.filter((s) => s.test(p)).map((s) => s.id),
}
const LIST_KEYS = Object.keys(VALUES) as ListKey[]

/** Does a product pass the filters, `except` one group (so that group's counts show what adding a value gives)? */
function passes(p: CardProduct, f: Filters, except?: ListKey | "price" | "rating" | "stock") {
  if (except !== "stock" && f.inStock && !p.inStock) return false
  if (except !== "price" && ((f.min != null && p.price < f.min) || (f.max != null && p.price > f.max))) return false
  if (except !== "rating" && f.rating != null && (p.rating ?? 0) < f.rating) return false
  for (const k of LIST_KEYS) {
    if (k === except || !f[k].length) continue
    const values = VALUES[k](p)
    if (!f[k].some((v) => values.includes(v))) return false
  }
  return true
}

export function Catalogue({ products, universes = [], initial }: {
  products: CardProduct[]
  /** each universe's round image from the backoffice (hero) */
  universes?: { name: string; image: string | null }[]
  initial: { universe: string; q: string; sort: string }
}) {
  const [universe, setUniverse] = useState(initial.universe)
  const [q, setQ] = useState(initial.q)
  const [sort, setSort] = useState(initial.sort)
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [shown, setShown] = useState(PAGE)
  const [panel, setPanel] = useState(false)
  const [brandQuery, setBrandQuery] = useState("")
  const [priceInput, setPriceInput] = useState({ min: "", max: "" })
  // which groups are unfolded, and which show all their values
  const [openGroups, setOpenGroups] = useState<string[]>(["sort", "price", "forms", "benefits"])
  const [expanded, setExpanded] = useState<string[]>([])
  const toggleGroup = (id: string) => setOpenGroups((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]))

  // the links of the menu land here with ?univers= / ?q= : follow them when the page is reused
  useEffect(() => {
    setUniverse(initial.universe)
    setQ(initial.q)
    setSort(initial.sort)
  }, [initial.universe, initial.q, initial.sort])

  // the address follows the universe, the search and the sort (shareable, back button)
  useEffect(() => {
    const u = UNIVERSES.find((x) => x.name === universe)?.slug
    const p = new URLSearchParams()
    if (u) p.set("univers", u)
    if (q.trim()) p.set("q", q.trim())
    if (sort) p.set("tri", sort)
    const url = `/boutique${p.size ? `?${p}` : ""}`
    if (url !== window.location.pathname + window.location.search) window.history.replaceState(null, "", url)
    setShown(PAGE)
  }, [universe, q, sort])
  useEffect(() => setShown(PAGE), [filters])

  useEffect(() => {
    document.body.style.overflow = panel ? "hidden" : ""
  }, [panel])

  // universe + search first; the filters below count within this set
  const base = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean)
    return products.filter((p) => {
      if (universe && p.universe !== universe) return false
      if (!words.length) return true
      const text = norm(`${p.name} ${p.brand} ${p.form} ${p.universe} ${p.benefits.join(" ")} ${p.skinTypes.join(" ")} ${p.code}`)
      return words.every((w) => text.includes(w))
    })
  }, [products, universe, q])

  const result = useMemo(() => {
    const list = base.filter((p) => passes(p, filters))
    const score = (p: CardProduct) => (p.image ? 4 : 0) + (p.featured ? 2 : 0) + (p.bestseller ? 2 : 0) + (p.inStock ? 1 : 0)
    const by: Record<string, (a: CardProduct, b: CardProduct) => number> = {
      "": (a, b) => score(b) - score(a),
      ventes: (a, b) => Number(b.bestseller) - Number(a.bestseller) || score(b) - score(a),
      nouveautes: (a, b) => Number(b.isNew) - Number(a.isNew) || b.createdAt.localeCompare(a.createdAt),
      "prix-asc": (a, b) => a.price - b.price,
      "prix-desc": (a, b) => b.price - a.price,
      notes: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviews - a.reviews,
    }
    return [...list].sort(by[sort] ?? by[""])
  }, [base, sort, filters])

  // each group's values, counted with every other filter applied (most frequent first; picked ones kept)
  const facets = useMemo(() => {
    const out = {} as Record<ListKey, [string, number][]>
    for (const k of LIST_KEYS) {
      const m = new Map<string, number>()
      for (const p of base) if (passes(p, filters, k)) for (const v of VALUES[k](p)) if (v) m.set(v, (m.get(v) ?? 0) + 1)
      for (const v of filters[k]) if (!m.has(v)) m.set(v, 0)
      out[k] = [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))
    }
    return out
  }, [base, filters])
  const priceCount = (min: number | null, max: number | null) =>
    base.filter((p) => passes(p, filters, "price") && (min == null || p.price >= min) && (max == null || p.price <= max)).length
  const stockCount = useMemo(() => base.filter((p) => p.inStock && passes(p, filters, "stock")).length, [base, filters])
  const rated = useMemo(() => base.some((p) => p.rating != null), [base])

  const toggle = (k: ListKey, v: string) =>
    setFilters((f) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] }))
  const setPrice = (min: number | null, max: number | null) => {
    setFilters((f) => ({ ...f, min, max }))
    setPriceInput({ min: min == null ? "" : String(min), max: max == null ? "" : String(max) })
  }
  const applyPriceInput = () => {
    const min = priceInput.min.trim() ? Math.max(0, Number(priceInput.min.replace(/\D/g, ""))) : null
    const max = priceInput.max.trim() ? Math.max(0, Number(priceInput.max.replace(/\D/g, ""))) : null
    setFilters((f) => ({ ...f, min, max }))
  }
  const clearAll = () => {
    setFilters(NO_FILTERS)
    setPriceInput({ min: "", max: "" })
  }

  const heroImage = universes.find((u) => u.name === universe)?.image ?? null
  const counts = useMemo(() => Object.fromEntries(UNIVERSES.map((u) => [u.name, products.filter((p) => p.universe === u.name).length])), [products])
  const priceLabel = filters.min != null || filters.max != null
    ? filters.min != null && filters.max != null ? `${formatPrice(filters.min)} à ${formatPrice(filters.max)}`
      : filters.min != null ? `Dès ${formatPrice(filters.min)}` : `Jusqu'à ${formatPrice(filters.max!)}`
    : ""
  const selectionLabel = (id: string) => SELECTIONS.find((s) => s.id === id)?.label ?? id
  const chosen = LIST_KEYS.flatMap((k) => filters[k].map((v) => ({ k, v, label: k === "selections" ? selectionLabel(v) : v })))
  const active = chosen.length + Number(filters.inStock) + Number(!!priceLabel) + Number(filters.rating != null)

  // a filter group, folding (title, number of choices made, + that turns into −)
  const group = (title: string, id: string, picked: number, children: React.ReactNode, extra = "") => (
    <div className={`${styles.group} ${openGroups.includes(id) ? styles.groupOpen : ""} ${extra}`}>
      <button type="button" className={styles.groupHead} onClick={() => toggleGroup(id)} aria-expanded={openGroups.includes(id)}>
        <span>{title}</span>
        {picked > 0 && <em>{picked}</em>}
        <i className={styles.groupIcon} aria-hidden="true" />
      </button>
      <div className={styles.groupBody}><div>{children}</div></div>
    </div>
  )
  const options = (k: ListKey, values: [string, number][], label = (v: string) => v) => {
    const all = expanded.includes(k)
    return (
      <>
        {(all ? values : values.slice(0, FIRST)).map(([v, n]) => (
          <label key={v} className={`${styles.check} ${n === 0 && !filters[k].includes(v) ? styles.empty0 : ""}`}>
            <input type="checkbox" checked={filters[k].includes(v)} onChange={() => toggle(k, v)} />
            <span>{label(v)}</span>
            <small>{n}</small>
          </label>
        ))}
        {values.length > FIRST && (
          <button type="button" className={styles.moreLink}
            onClick={() => setExpanded((e) => (all ? e.filter((x) => x !== k) : [...e, k]))}>
            {all ? "Voir moins" : `Voir plus (${values.length - FIRST})`}
          </button>
        )}
      </>
    )
  }

  const brandList = facets.brands.filter(([b]) => !brandQuery || norm(b).includes(norm(brandQuery)))

  return (
    <div className={styles.page}>
      {/* hero (like the first universe tile): black and gold, text on the left, the universe's image on the
          right; the image changes with the tab */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <nav className={styles.crumbs} aria-label="Fil d'Ariane">
              <Link href="/">Accueil</Link><span>/</span><span>Boutique</span>
            </nav>
            <h1 key={universe || "all"}>{universe ? <>Soins {universe.toLowerCase()}<span>.</span></> : <>Tous nos soins<span>.</span></>}</h1>
            <p className={styles.lead}>
              {UNIVERSES.find((u) => u.name === universe)?.tagline ?? "Visage, corps, bébé et bien-être : notre sélection, livrée à Abidjan."}
            </p>
            <div className={styles.chips} role="tablist" aria-label="Univers">
              <button type="button" role="tab" aria-selected={!universe} className={!universe ? styles.on : ""} onClick={() => setUniverse("")}>
                Tout <span>{products.length}</span>
              </button>
              {UNIVERSES.filter((u) => counts[u.name]).map((u) => (
                <button key={u.slug} type="button" role="tab" aria-selected={universe === u.name} className={universe === u.name ? styles.on : ""}
                  onClick={() => { setUniverse(u.name); clearAll() }}>
                  {u.name} <span>{counts[u.name]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.heroArt} aria-hidden="true">
            <span className={styles.ring} />
            <span className={`${styles.ring} ${styles.ring2}`} />
            <span className={`${styles.ring} ${styles.ring3}`} />
            <span key={universe || "all"} className={styles.heroVisual}>
              {heroImage ? (
                <span className={styles.heroRound}><Image src={heroImage} alt="" fill sizes="(max-width: 900px) 60vw, 420px" priority /></span>
              ) : universe ? (
                <span className={styles.heroInitial}>{universe[0]}</span>
              ) : (
                <Image src="/haristore-mark.png" alt="" width={300} height={190} className={styles.heroMark} priority />
              )}
            </span>
          </div>
        </div>
      </section>

      <div className={`container ${styles.layout}`}>
        <aside className={`${styles.side} ${panel ? styles.open : ""}`} aria-label="Filtres">
          <div className={styles.sideHead}>
            <span className={styles.grabber} aria-hidden="true" />
            <div>
              <strong>Filtrer et trier</strong>
              <small>{result.length} produit{result.length > 1 ? "s" : ""}</small>
            </div>
            <button type="button" onClick={() => setPanel(false)} aria-label="Fermer les filtres"><CloseIcon /></button>
          </div>
          <div className={styles.sideBody}>
            <div className={styles.sideTitle}>
              <strong>Filtres</strong>
              {active > 0 && <button type="button" onClick={clearAll}>Tout effacer</button>}
            </div>

            {/* phones: the sort lives in the panel */}
            {group("Trier par", "sort", 0, (
              <div className={styles.sortChips}>
                {SORTS.map((o) => (
                  <button key={o.id} type="button" className={sort === o.id ? styles.on : ""} onClick={() => setSort(o.id)}>{o.label}</button>
                ))}
              </div>
            ), styles.mobileOnly)}

            <label className={`${styles.check} ${styles.stock}`}>
              <input type="checkbox" checked={filters.inStock} onChange={() => setFilters((f) => ({ ...f, inStock: !f.inStock }))} />
              <span>En stock uniquement</span>
              <small>{stockCount}</small>
              <i className={styles.switch} aria-hidden="true" />
            </label>

            {group("Prix", "price", Number(!!priceLabel), (
              <div className={styles.price}>
                <div className={styles.priceChips}>
                  {PRICES.map((r) => {
                    const on = filters.min === r.min && filters.max === r.max
                    return (
                      <button key={r.label} type="button" className={on ? styles.on : ""} onClick={() => (on ? setPrice(null, null) : setPrice(r.min, r.max))}>
                        {r.label} <small>{priceCount(r.min, r.max)}</small>
                      </button>
                    )
                  })}
                </div>
                <form className={styles.priceRange} onSubmit={(e) => { e.preventDefault(); applyPriceInput() }}>
                  <input inputMode="numeric" placeholder="Min" value={priceInput.min} onChange={(e) => setPriceInput((p) => ({ ...p, min: e.target.value }))} onBlur={applyPriceInput} aria-label="Prix minimum" />
                  <span>—</span>
                  <input inputMode="numeric" placeholder="Max" value={priceInput.max} onChange={(e) => setPriceInput((p) => ({ ...p, max: e.target.value }))} onBlur={applyPriceInput} aria-label="Prix maximum" />
                  <button type="submit" aria-label="Appliquer le prix">OK</button>
                </form>
              </div>
            ))}

            {facets.selections.length > 0 && group("Sélections", "selections", filters.selections.length, options("selections", facets.selections, selectionLabel))}
            {facets.forms.length > 0 && group("Type de produit", "forms", filters.forms.length, options("forms", facets.forms))}
            {facets.benefits.length > 0 && group("Besoin", "benefits", filters.benefits.length, options("benefits", facets.benefits))}
            {facets.skins.length > 0 && group("Type de peau", "skins", filters.skins.length, options("skins", facets.skins))}
            {facets.hairs.length > 0 && group("Type de cheveux", "hairs", filters.hairs.length, options("hairs", facets.hairs))}
            {facets.targets.length > 0 && group("Pour qui", "targets", filters.targets.length, options("targets", facets.targets))}
            {facets.brands.length > 0 && group("Marque", "brands", filters.brands.length, (
              <>
                <input className={styles.brandSearch} value={brandQuery} onChange={(e) => setBrandQuery(e.target.value)} placeholder="Chercher une marque" />
                <div className={styles.brands}>{options("brands", brandList)}</div>
              </>
            ))}
            {rated && group("Note", "rating", Number(filters.rating != null), (
              <div className={styles.ratings}>
                {[4, 3].map((r) => (
                  <label key={r} className={styles.check}>
                    <input type="radio" name="rating" checked={filters.rating === r} onChange={() => setFilters((f) => ({ ...f, rating: f.rating === r ? null : r }))}
                      onClick={() => filters.rating === r && setFilters((f) => ({ ...f, rating: null }))} />
                    <span className={styles.stars}>{[0, 1, 2, 3, 4].map((i) => <StarIcon key={i} size={13} filled={i < r ? 1 : 0} />)} et plus</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
          <div className={styles.sideFoot}>
            <button type="button" className="btn btn-light" onClick={clearAll} disabled={!active}>Effacer</button>
            <button type="button" className="btn btn-dark" onClick={() => setPanel(false)}>Voir {result.length} produits</button>
          </div>
        </aside>

        <div className={styles.main}>
          <div className={styles.toolbar}>
            <div className={styles.search}>
              <SearchIcon size={18} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un soin, une marque…" aria-label="Rechercher" />
              {q && <button type="button" onClick={() => setQ("")} aria-label="Effacer la recherche"><CloseIcon size={16} /></button>}
            </div>
            <button type="button" className={styles.filterBtn} onClick={() => setPanel(true)}>
              <FilterIcon size={18} /> Filtrer et trier{active ? <em>{active}</em> : null}
            </button>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className={styles.sort} aria-label="Trier">
              {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <p className={styles.count}>{result.length} produit{result.length > 1 ? "s" : ""}</p>
          {/* the filters in use, removable with one click */}
          {active > 0 && (
            <div className={styles.activeChips}>
              {filters.inStock && (
                <button type="button" onClick={() => setFilters((f) => ({ ...f, inStock: false }))}>En stock <CloseIcon size={13} /></button>
              )}
              {priceLabel && <button type="button" onClick={() => setPrice(null, null)}>{priceLabel} <CloseIcon size={13} /></button>}
              {filters.rating != null && (
                <button type="button" onClick={() => setFilters((f) => ({ ...f, rating: null }))}>{filters.rating}★ et plus <CloseIcon size={13} /></button>
              )}
              {chosen.map(({ k, v, label }) => (
                <button key={k + v} type="button" onClick={() => toggle(k, v)}>{label} <CloseIcon size={13} /></button>
              ))}
              <button type="button" className={styles.clearAll} onClick={clearAll}>Tout effacer</button>
            </div>
          )}

          {result.length ? (
            <>
              <div className={styles.grid}>
                {result.slice(0, shown).map((p, i) => <ProductCard key={p.id} product={p} priority={i < 3} n={i} />)}
              </div>
              {shown < result.length && (
                <div className={styles.more}>
                  <span>{shown} sur {result.length}</span>
                  <button type="button" className="btn btn-light" onClick={() => setShown((n) => n + PAGE)}>Voir plus de produits</button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.empty}>
              <h3>Aucun produit ne correspond</h3>
              <p>Essayez un autre mot ou retirez des filtres.</p>
              <button type="button" className="btn btn-dark" onClick={() => { setQ(""); clearAll(); setUniverse("") }}>Tout afficher</button>
            </div>
          )}
        </div>
      </div>
      {panel && <div className={styles.backdrop} onClick={() => setPanel(false)} />}
    </div>
  )
}
