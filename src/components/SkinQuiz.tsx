"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import type { CardProduct } from "@/lib/types"
import { formatPrice, SITE, whatsappLink } from "@/lib/site"
import { useCart } from "./CartProvider"
import { useCatalog } from "./Saved"
import { ArrowIcon, CheckIcon } from "./icons"
import styles from "./SkinQuiz.module.css"

// Skin diagnosis: 5 questions, then a routine built from the shop's products (universe, form, benefits,
// skin types of the web app), step by step, with an alternative per step. One click adds the routine to
// the cart; a conseillère can check it on WhatsApp. The last answers are kept in the browser.
type Zone = "visage" | "corps"
/** goal: the main priority; goal2: a second one, optional ("" = none) */
type Answers = { zone: Zone | "both"; skin: string; goal: string; goal2: string; sensitive: "oui" | "non"; avoid: string[]; budget: string }

/** Ingredients the client can't bear: a product is left out when its name or its ingredients (web app:
 *  ingrédients clés, ingrédients à surveiller) contain one of the words */
const AVOID: { value: string; label: string; words: string[] }[] = [
  { value: "carotte", label: "Carotte", words: ["carotte"] },
  { value: "papaye", label: "Papaye", words: ["papaye"] },
  { value: "niacinamide", label: "Niacinamide (vitamine B3)", words: ["niacinamide", "vitamine b3"] },
  { value: "vitamine-c", label: "Vitamine C", words: ["vitamine c", "gluta-c"] },
  { value: "glutathion", label: "Glutathion", words: ["glutathion"] },
  { value: "kojique", label: "Acide kojique", words: ["kojique", "kojic"] },
  { value: "arbutine", label: "Arbutine", words: ["arbutine", "arbutin"] },
  { value: "retinol", label: "Rétinol (vitamine A)", words: ["retinol", "vitamine a", "retinal"] },
  { value: "acides", label: "Acides exfoliants (AHA, glycolique, salicylique)", words: ["aha", "glycolique", "salicylique", "lactique", "acide de fruit"] },
  { value: "curcuma", label: "Curcuma", words: ["curcuma"] },
  { value: "reglisse", label: "Réglisse", words: ["reglisse"] },
  { value: "karite", label: "Beurre de karité", words: ["karite"] },
  { value: "noix", label: "Amande, noix (fruits à coque)", words: ["amande", "noix", "argan"] },
  { value: "lait", label: "Lait (vache, chèvre)", words: ["lait de chevre", "lait de vache", "lait d'anesse"] },
  { value: "miel", label: "Miel", words: ["miel"] },
  { value: "escargot", label: "Bave d'escargot", words: ["escargot", "mucine"] },
  { value: "parfum", label: "Parfum, huiles essentielles", words: ["parfum", "huiles essentielles", "huile essentielle", "tea tree", "arbre a the"] },
]
const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/œ/g, "oe")
/** "aha" must be a word ("sahara" is not), the longer words may be part of one */
const contains = (text: string, word: string) => (word.length <= 4 ? new RegExp(`(^|[^a-z])${word}([^a-z]|$)`).test(text) : text.includes(word))
const hasAvoided = (p: CardProduct, avoid: string[]) => {
  if (!avoid.length) return false
  const text = plain(`${p.name} ${p.ingredients.join(" ")}`)
  return AVOID.filter((x) => avoid.includes(x.value)).some((x) => x.words.some((w) => contains(text, w)))
}

/** Signs of a concentrated lightening care: its actives, or the words of its name */
const INTENSE = ["glutathion", "kojique", "arbutine", "tranexamique", "glycolique", "aha", "intense", "extra", "express", "ultra", "puissant", "super", "fort"]

type Question = { key: keyof Answers; title: string; hint?: string; multi?: boolean; options: { value: string; label: string; text?: string }[] }
const QUESTIONS: Question[] = [
  { key: "zone", title: "Pour quelle partie ?", options: [
    { value: "visage", label: "Le visage" }, { value: "corps", label: "Le corps" }, { value: "both", label: "Les deux" },
  ] },
  { key: "skin", title: "Comment est votre peau ?", hint: "En fin de journée, sans soin.", options: [
    { value: "grasse", label: "Grasse", text: "Brillante, pores visibles" },
    { value: "seche", label: "Sèche", text: "Tiraille, rugueuse" },
    { value: "mixte", label: "Mixte", text: "Brillante au centre, sèche ailleurs" },
    { value: "normale", label: "Normale", text: "Confortable" },
    { value: "inconnu", label: "Je ne sais pas" },
  ] },
  { key: "goal", title: "Votre priorité ?", options: [
    { value: "eclaircir", label: "Éclaircir et unifier le teint" },
    { value: "intense", label: "Un éclaircissement intense", text: "Un teint nettement plus clair, des soins plus concentrés" },
    { value: "taches", label: "Atténuer taches et marques" },
    { value: "acne", label: "Boutons et imperfections" },
    { value: "hydrater", label: "Hydrater et nourrir" },
    { value: "eclat", label: "Un teint lumineux" },
    { value: "age", label: "Rides et fermeté" },
    { value: "vergetures", label: "Vergetures" },
  ] },
  { key: "goal2", title: "Et en second ?", hint: "Un autre souci à traiter en même temps, si vous en avez un.", options: [] },
  { key: "sensitive", title: "Votre peau réagit-elle facilement ?", hint: "Rougeurs, picotements, irritations.", options: [
    { value: "oui", label: "Oui, elle est sensible" }, { value: "non", label: "Non" },
  ] },
  { key: "avoid", multi: true, title: "Certains ingrédients vous font-ils réagir ?",
    hint: "Choisissez ceux que vous ne supportez pas : nous ne vous proposerons aucun soin qui en contient. Aucun ? Continuez.",
    options: AVOID.map(({ value, label }) => ({ value, label })) },
  { key: "budget", title: "Votre budget pour la routine ?", hint: "Nous composons la routine pour rester dans ce budget, en gardant toujours les soins indispensables.", options: [
    { value: "0-10000", label: "Moins de 10 000 F" },
    { value: "0-25000", label: "Jusqu'à 25 000 F" },
    { value: "25000-60000", label: "De 25 000 à 60 000 F" },
    { value: "any", label: "Peu importe" },
  ] },
]

// the second priority offers the same goals as the first (except the one chosen), or nothing more
QUESTIONS[3].options = [...QUESTIONS[2].options, { value: "", label: "Rien d'autre" }]

const GOALS: Record<string, string[]> = {
  eclaircir: ["Éclaircissant", "Unifiant"],
  intense: ["Éclaircissant", "Unifiant", "Anti-taches"],
  taches: ["Anti-taches", "Unifiant", "Éclaircissant"],
  acne: ["Anti-acné", "Purifiant", "Matifiant"],
  hydrater: ["Hydratant", "Nourrissant"],
  eclat: ["Éclat", "Éclaircissant"],
  age: ["Anti-âge", "Raffermissant"],
  vergetures: ["Anti-vergetures", "Raffermissant", "Nourrissant"],
}
const SKINS: Record<string, string[]> = {
  grasse: ["Grasse", "Acnéique", "Mixte"], seche: ["Sèche", "Déshydratée"], mixte: ["Mixte", "Grasse"], normale: ["Normale"], inconnu: [],
}

/** essential: always kept, even a little over the budget; the others go first when the budget is short */
type Step = { title: string; when: string; forms: string[]; benefits?: string[]; optional?: boolean; essential?: boolean }
const ROUTINES: Record<Zone, Step[]> = {
  visage: [
    { title: "Nettoyer", when: "Matin et soir", forms: ["Savon", "Gel", "Mousse", "Eau micellaire"], essential: true },
    { title: "Traiter", when: "Le soir", forms: ["Sérum", "Contour des yeux"] },
    { title: "Hydrater", when: "Matin et soir", forms: ["Crème", "Lotion", "Gel", "Lait"], essential: true },
    { title: "Protéger", when: "Le matin", forms: ["Crème", "Lotion", "Gel", "Lait"], benefits: ["Protection solaire"] },
  ],
  corps: [
    { title: "Laver", when: "À la douche", forms: ["Gel douche", "Savon"], essential: true },
    { title: "Exfolier", when: "1 à 2 fois par semaine", forms: ["Gommage"], optional: true },
    { title: "Soigner", when: "Après la douche", forms: ["Lait", "Lotion", "Crème", "Huile", "Beurre", "Sérum"], essential: true },
  ],
}

const KEY = "hari-diagnostic"

/** The budget of the whole routine (F): "min-max", "any" = none; an old saved answer "15000" is a maximum */
const budgetOf = (b: string | undefined) => (b === "any" || !b ? Infinity : Number(b.includes("-") ? b.split("-")[1] : b))
/** a little over the budget is accepted rather than losing a good care */
const MARGIN = 1.1

type Planned = Step & { candidates: CardProduct[]; main: CardProduct | null; alt: CardProduct[] }

export function recommend(catalog: CardProduct[], a: Answers) {
  const wanted = GOALS[a.goal] ?? []
  const second = (a.goal2 && a.goal2 !== a.goal ? GOALS[a.goal2] : null) ?? []
  const skins = SKINS[a.skin] ?? []
  const budget = budgetOf(a.budget)
  const zones: Zone[] = a.zone === "both" ? ["visage", "corps"] : [a.zone]
  const used = new Set<string>()
  const result = zones.map((zone) => ({
    zone,
    steps: ROUTINES[zone].map((step): Planned => {
      const universe = zone === "visage" ? "Visage" : "Corps"
      const candidates = catalog
        .filter((p) => p.inStock && p.universe === universe && step.forms.includes(p.form) && p.price <= budget)
        .filter((p) => !step.benefits || step.benefits.some((b) => p.benefits.includes(b)))
        .filter((p) => !hasAvoided(p, a.avoid ?? []))
        .map((p) => {
          let s = 0
          for (const b of wanted) if (p.benefits.includes(b)) s += b === wanted[0] ? 4 : 2
          // the second priority: a care that answers both comes first
          for (const b of second) if (p.benefits.includes(b)) s += b === second[0] ? 2.5 : 1
          if (skins.some((k) => p.skinTypes.includes(k))) s += 3
          else if (p.skinTypes.includes("Tous types")) s += 1
          if (a.sensitive === "oui") s += p.benefits.some((b) => ["Apaisant", "Doux"].includes(b)) || p.skinTypes.includes("Sensible") ? 2 : 0
          // "intense": the most concentrated lightening care first (strong actives, "intense", "extra"… in the name)
          if (a.goal === "intense" && p.benefits.includes("Éclaircissant") && INTENSE.some((w) => plain(`${p.name} ${p.ingredients.join(" ")}`).includes(w))) s += 3
          if (p.image) s += 1.5
          if (p.bestseller || p.featured) s += 1
          return { p, s }
        })
        .filter((x) => x.s > 1.5 || step.benefits)
        .sort((x, y) => y.s - x.s)
        .map((x) => x.p)
        .filter((p) => !used.has(p.id))
        .slice(0, 8)
      if (candidates[0]) used.add(candidates[0].id)
      return { ...step, candidates, main: candidates[0] ?? null, alt: candidates.slice(1, 3) }
    }).filter((s) => s.main),
  }))
  return fitBudget(result, budget)
}

/** Keeps the routine within the budget (+10 %): first cheaper good products, then without the steps that
 *  are not essential (the optional ones first, the dearest first). The essential ones always stay. */
function fitBudget(zones: { zone: Zone; steps: Planned[] }[], budget: number) {
  const dropped: string[] = []
  const limit = budget * MARGIN
  const all = () => zones.flatMap((z) => z.steps)
  const total = () => all().reduce((n, s) => n + (s.main?.price ?? 0), 0)
  if (budget !== Infinity && total() > limit) {
    // 1. a cheaper product among the 5 best of each step, the dearest step first
    for (const s of [...all()].sort((x, y) => (y.main?.price ?? 0) - (x.main?.price ?? 0))) {
      if (total() <= limit) break
      const cheaper = s.candidates.slice(0, 5).filter((p) => p.price < (s.main?.price ?? 0)).sort((x, y) => x.price - y.price)
      const enough = [...cheaper].reverse().find((p) => total() - (s.main?.price ?? 0) + p.price <= limit)
      const pick = enough ?? cheaper[0]
      if (pick) s.main = pick
    }
    // 2. without the steps that are not essential
    const rank = (s: Step) => (s.optional ? 0 : 1)
    for (const s of all().filter((x) => !x.essential).sort((x, y) => rank(x) - rank(y) || (y.main?.price ?? 0) - (x.main?.price ?? 0))) {
      if (total() <= limit) break
      dropped.push(s.title)
      s.main = null
    }
    for (const z of zones) z.steps = z.steps.filter((s) => s.main)
    for (const s of all()) s.alt = s.candidates.filter((p) => p.id !== s.main!.id).slice(0, 2)
  }
  return { zones, dropped, budget, over: budget !== Infinity && total() > limit }
}

export function SkinQuiz() {
  const catalog = useCatalog(true)
  const { add } = useCart()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Partial<Answers>>({})
  const [picked, setPicked] = useState<Record<string, string>>({}) // step key → product id (alternatives)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null")
      if (saved?.goal) { setAnswers({ avoid: [], ...saved }); setStep(QUESTIONS.length) }
    } catch {}
  }, [])

  const done = step >= QUESTIONS.length
  const result = useMemo(() => (done && catalog ? recommend(catalog, answers as Answers) : null), [done, catalog, answers])
  const routine = result?.zones.flatMap((z) => z.steps.map((s) => {
    const key = `${z.zone}-${s.title}`
    const chosen = [s.main!, ...s.alt].find((p) => p.id === picked[key]) ?? s.main!
    return { key, zone: z.zone, step: s, product: chosen }
  })) ?? []
  const total = routine.reduce((n, r) => n + r.product.price, 0)

  const answer = (key: keyof Answers, value: string | string[]) => {
    const next = { ...answers, [key]: value }
    // the body has no "skin type" question that matters as much: keep the flow the same, simple
    setAnswers(next)
    if (step === QUESTIONS.length - 1) {
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
    }
    setStep((s) => s + 1)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  const restart = () => {
    setAnswers({}); setPicked({}); setStep(0)
    try { localStorage.removeItem(KEY) } catch {}
  }
  const addAll = () => {
    routine.forEach((r) => add(r.product))
    setAdded(true)
  }

  if (!done) {
    const q = QUESTIONS[step]
    return (
      <div className={styles.quiz}>
        <div className={styles.progress} aria-hidden="true"><span style={{ width: `${(step / QUESTIONS.length) * 100}%` }} /></div>
        <p className={styles.count}>Question {step + 1} sur {QUESTIONS.length}</p>
        <h2 key={q.key} className={styles.question}>{q.title}</h2>
        {q.hint && <p className={styles.hint}>{q.hint}</p>}
        {q.multi ? (
          <>
            <div className={styles.chips}>
              {q.options.map((o) => {
                const on = (answers.avoid ?? []).includes(o.value)
                return (
                  <button key={o.value} type="button" aria-pressed={on} className={`${styles.chip} ${on ? styles.on : ""}`}
                    onClick={() => setAnswers((x) => ({ ...x, avoid: on ? (x.avoid ?? []).filter((v) => v !== o.value) : [...(x.avoid ?? []), o.value] }))}>
                    {on && <CheckIcon size={14} />} {o.label}
                  </button>
                )
              })}
            </div>
            <button type="button" className={`btn btn-dark ${styles.next}`} onClick={() => answer("avoid", answers.avoid ?? [])}>
              {(answers.avoid ?? []).length ? `Continuer sans ces ${(answers.avoid ?? []).length} ingrédient${(answers.avoid ?? []).length > 1 ? "s" : ""}` : "Aucun, continuer"} <ArrowIcon size={18} />
            </button>
          </>
        ) : (
        <div className={styles.options}>
          {q.options.filter((o) => !((q.key === "goal" || q.key === "goal2") && o.value === "vergetures" && answers.zone === "visage"))
            .filter((o) => !(q.key === "goal2" && o.value === answers.goal)).map((o) => (
            <button key={o.value} type="button" className={`${styles.option} ${answers[q.key] === o.value ? styles.on : ""}`} onClick={() => answer(q.key, o.value)}>
              <strong>{o.label}</strong>
              {o.text && <span>{o.text}</span>}
            </button>
          ))}
        </div>
        )}
        {step > 0 && <button type="button" className={styles.back} onClick={() => setStep((s) => s - 1)}>← Question précédente</button>}
      </div>
    )
  }

  if (!result) return <p className={styles.hint}>Nous composons votre routine…</p>

  const goal = QUESTIONS[2].options.find((o) => o.value === answers.goal)?.label ?? ""
  const goal2 = answers.goal2 && answers.goal2 !== answers.goal ? QUESTIONS[2].options.find((o) => o.value === answers.goal2)?.label ?? "" : ""
  const avoided = AVOID.filter((x) => (answers.avoid ?? []).includes(x.value)).map((x) => x.label.split(" (")[0].toLowerCase())
  const message = `Bonjour ${SITE.name}, voici ma routine du diagnostic (${goal.toLowerCase()}${goal2 ? `, puis ${goal2.toLowerCase()}` : ""}) :\n${routine.map((r) => `- ${r.step.title} : ${r.product.name}`).join("\n")}\nPouvez-vous la vérifier pour ma peau ?`

  return (
    <div className={styles.result}>
      <div className={styles.resultHead}>
        <span className="script text-gold">Votre routine</span>
        <h2>{goal}</h2>
        {goal2 && <p className={styles.second}>+ {goal2.charAt(0).toLowerCase() + goal2.slice(1)}</p>}
        <p>Peau {QUESTIONS[1].options.find((o) => o.value === answers.skin)?.label.toLowerCase()}{answers.sensitive === "oui" ? ", sensible" : ""}{avoided.length ? `, sans ${avoided.join(", ")}` : ""}. Voici les soins de notre boutique qui y répondent le mieux, dans l&apos;ordre où les appliquer.</p>
      </div>

      {!routine.length ? (
        <p className={styles.hint}>Nous n&apos;avons pas trouvé de soins adaptés dans ce budget. Essayez « Peu importe » ou demandez conseil.</p>
      ) : (
        result.zones.map((z) => (
          <section key={z.zone} className={styles.zone}>
            {result.zones.length > 1 && <h3>{z.zone === "visage" ? "Visage" : "Corps"}</h3>}
            <ol className={styles.steps}>
              {z.steps.map((s, i) => {
                const key = `${z.zone}-${s.title}`
                const current = routine.find((r) => r.key === key)!.product
                return (
                  <li key={key} className={styles.step}>
                    <span className={styles.num}>{i + 1}</span>
                    <div className={styles.stepBody}>
                      <p className={styles.stepTitle}><strong>{s.title}</strong> · {s.when}{s.optional ? " · facultatif" : ""}</p>
                      <Link href={`/produit/${current.slug}`} className={styles.product}>
                        <span className={styles.thumb}>{current.image && <Image src={current.image} alt="" fill sizes="80px" />}</span>
                        <span className={styles.info}>
                          <span>{current.brand}</span>
                          <strong>{current.name}</strong>
                          <em>{formatPrice(current.price)}</em>
                        </span>
                      </Link>
                      {s.alt.length > 0 && (
                        <div className={styles.alts}>
                          <span>Autre choix :</span>
                          {[s.main!, ...s.alt].filter((p) => p.id !== current.id).map((p) => (
                            <button key={p.id} type="button" onClick={() => setPicked((x) => ({ ...x, [key]: p.id }))}>{p.name}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        ))
      )}

      {routine.length > 0 && (
        <div className={styles.cta}>
          <p>
            Toute la routine : <strong>{formatPrice(total)}</strong>
            {result.budget !== Infinity && <span className={styles.budget}> · votre budget : {formatPrice(result.budget)}</span>}
          </p>
          {result.dropped.length > 0 && (
            <p className={styles.budgetNote}>
              Pour rester dans votre budget, nous avons laissé de côté : {result.dropped.join(", ").toLowerCase()}. Vous pourrez les ajouter plus tard.
            </p>
          )}
          {result.over && (
            <p className={styles.budgetNote}>Un peu au-dessus de votre budget : ces soins sont les indispensables de votre routine.</p>
          )}
          <button type="button" className="btn btn-dark" onClick={addAll}>
            {added ? <><CheckIcon size={18} /> Ajoutée au panier</> : <>Ajouter la routine au panier <ArrowIcon size={18} /></>}
          </button>
          {added && <Link href="/panier" className="btn btn-light">Voir le panier</Link>}
          {SITE.whatsapp && (
            <a href={whatsappLink(message)} target="_blank" rel="noopener" className={styles.wa}>Faire vérifier par une conseillère sur WhatsApp</a>
          )}
        </div>
      )}
      <button type="button" className={styles.back} onClick={restart}>Recommencer le diagnostic</button>
      <p className={styles.note}>Ce diagnostic oriente vers des soins de notre boutique ; il ne remplace pas l&apos;avis d&apos;un dermatologue.</p>
    </div>
  )
}
