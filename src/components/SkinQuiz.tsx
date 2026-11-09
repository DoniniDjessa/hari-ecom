"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { AVOID, QUESTIONS, goalFits, goalLabel, momentFor, questionsFor, recommend, toneLabel, type Answers } from "@/lib/diagnostic"
import { formatPrice, SITE, whatsappLink } from "@/lib/site"
import { useCart } from "./CartProvider"
import { useCatalog } from "./Saved"
import { ArrowIcon, CheckIcon } from "./icons"
import styles from "./SkinQuiz.module.css"
import { Euro } from "@/components/Euro"

// Skin diagnosis: 9 to 10 questions (the face's and the body's skin as the zone asks), then a routine built from the shop's products (lib/diagnostic.ts: the
// questions and the engine), step by step, each product with its reasons and an alternative, then the advice
// that goes with it. One click adds the routine to the cart; a conseillère can check it on WhatsApp. The
// last answers are kept in the browser.
const KEY = "hari-diagnostic"

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
      if (saved?.goal) { setAnswers({ avoid: [], pregnant: "non", ...saved }); setStep(99) }
    } catch {}
  }, [])

  // the questions to ask, given the zone chosen (face, body or both)
  const questions = questionsFor(answers)
  const done = step >= questions.length
  const result = useMemo(() => (done && catalog ? recommend(catalog, answers as Answers) : null), [done, catalog, answers])
  const routine = result?.zones.flatMap((z) => z.steps.map((s) => {
    const key = `${z.zone}-${s.id}`
    const chosen = [s.main!, ...s.alt].find((p) => p.id === picked[key]) ?? s.main!
    return { key, zone: z.zone, step: s, product: chosen }
  })) ?? []
  const total = routine.reduce((n, r) => n + r.product.price, 0)

  const answer = (key: keyof Answers, value: string | string[]) => {
    const next = { ...answers, [key]: value }
    setAnswers(next)
    if (step >= questionsFor(next).length - 1) {
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
    const q = questions[step]
    return (
      <div className={styles.quiz}>
        <div className={styles.progress} aria-hidden="true"><span style={{ width: `${(step / questions.length) * 100}%` }} /></div>
        <p className={styles.count}>Question {step + 1} sur {questions.length}</p>
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
          {q.options.filter((o) => !(q.key === "goal" || q.key === "goal2") || goalFits(o, answers.zone))
            .filter((o) => !(q.key === "goal2" && o.value === answers.goal)).map((o) => (
            <button key={o.value} type="button" className={`${styles.option} ${o.swatch ? styles.tone : ""} ${answers[q.key] === o.value ? styles.on : ""}`} onClick={() => answer(q.key, o.value)}>
              {o.swatch && <span className={styles.swatch} style={{ background: o.swatch }} aria-hidden="true" />}
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

  const goal = goalLabel(answers.goal ?? "")
  const goal2 = answers.goal2 && answers.goal2 !== answers.goal ? goalLabel(answers.goal2) : ""
  const skinWord = (key: "skin" | "bodySkin") => {
    const v = answers[key]
    return !v || v === "inconnu" ? "" : QUESTIONS.find((q) => q.key === key)?.options.find((o) => o.value === v)?.label.toLowerCase() ?? ""
  }
  const face = answers.zone !== "corps" ? skinWord("skin") : ""
  const body = answers.zone !== "visage" ? skinWord("bodySkin") || (answers.zone === "corps" ? skinWord("skin") : "") : ""
  const profile = [
    toneLabel(answers.tone) && `Teint ${toneLabel(answers.tone).toLowerCase()}`,
    face && body ? `peau ${face} au visage, ${body} sur le corps` : face || body ? `peau ${face || body}` : "",
  ].filter(Boolean).join(", ").replace(/^p/, "P") || "Votre peau"
  const avoided = AVOID.filter((x) => (answers.avoid ?? []).includes(x.value)).map((x) => x.label.split(" (")[0].toLowerCase())
  const message = `Bonjour ${SITE.name}, voici ma routine du diagnostic (${goal.toLowerCase()}${goal2 ? `, puis ${goal2.toLowerCase()}` : ""}) :\n${routine.map((r) => `- ${r.step.title} : ${r.product.name}`).join("\n")}\nPouvez-vous la vérifier pour ma peau ?`

  return (
    <div className={styles.result}>
      <div className={styles.resultHead}>
        <span className="script text-gold">Votre routine</span>
        <h2>{goal}</h2>
        {goal2 && <p className={styles.second}>+ {goal2.charAt(0).toLowerCase() + goal2.slice(1)}</p>}
        <p>{profile}{answers.sensitive === "oui" ? ", sensible" : ""}{answers.pregnant === "oui" ? ", grossesse ou allaitement" : ""}{avoided.length ? `, sans ${avoided.join(", ")}` : ""}. Voici les soins de notre boutique qui y répondent le mieux, dans l&apos;ordre où les appliquer.</p>
      </div>

      {!routine.length ? (
        <p className={styles.hint}>Nous n&apos;avons pas trouvé de soins adaptés dans ce budget. Essayez « Peu importe » ou demandez conseil.</p>
      ) : (
        result.zones.map((z) => (
          <section key={z.zone} className={styles.zone}>
            {result.zones.length > 1 && <h3>{z.zone === "visage" ? "Visage" : "Corps"}</h3>}
            <ol className={styles.steps}>
              {z.steps.map((s, i) => {
                const key = `${z.zone}-${s.id}`
                const current = routine.find((r) => r.key === key)!.product
                const why = s.why[current.id] ?? []
                return (
                  <li key={key} className={styles.step}>
                    <span className={styles.num}>{i + 1}</span>
                    <div className={styles.stepBody}>
                      <p className={styles.stepTitle}><strong>{s.title}</strong> · {momentFor(s, current)}{s.optional ? " · facultatif" : ""}</p>
                      <Link href={`/produit/${current.slug}`} className={styles.product}>
                        <span className={styles.thumb}>{current.image && <Image src={current.image} alt="" fill sizes="80px" />}</span>
                        <span className={styles.info}>
                          <span>{current.brand}</span>
                          <strong>{current.name}</strong>
                          <em>{formatPrice(current.price)}</em>
                        </span>
                      </Link>
                      {why.length > 0 && (
                        <ul className={styles.why} aria-label="Pourquoi ce soin">
                          {why.map((w) => <li key={w}><CheckIcon size={12} /> {w}</li>)}
                        </ul>
                      )}
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

      {routine.length > 0 && result.advice.length > 0 && (
        <section className={styles.advice}>
          <h3>Les conseils de nos conseillères</h3>
          <ul>{result.advice.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>
      )}

      {routine.length > 0 && (
        <div className={styles.cta}>
          <p>
            Toute la routine : <strong>{formatPrice(total)}</strong> <Euro amount={total} className="euro-inline" />
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
