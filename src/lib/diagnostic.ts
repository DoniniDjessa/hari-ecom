// Skin diagnosis (components/SkinQuiz.tsx): the questions and the engine that builds the routine from the
// shop's products. What a beauty adviser would do:
// - the zone is strict: a face routine only has "Visage" products, a body routine only "Corps" products;
// - every product is read (name, benefits, skin types, key ingredients of the web app) to know its actives
//   (retinol, AHA, salicylic acid, SPF…), the skin it suits and whether it lightens;
// - safety first: never corticoids, hydroquinone or tretinoin; during pregnancy no retinol, no salicylic
//   acid, no strong lightening; sensitive skin: no harsh formulas; nothing that contains an ingredient the
//   client cannot bear;
// - no product for the opposite skin (an oily-skin gel for a dry skin), no lightening care for someone
//   who did not ask for it, no soap to wash a dry face, no retinol with an acid in the same routine;
// - each step needs the right kind of product (a "Gel" is a cleanser only if it says so), the sun cream
//   is part of the routine as soon as it lightens, treats spots or uses acids;
// - each product comes with its reasons ("Pour peau sèche", "Actifs : niacinamide"), the routine with the
//   advice that goes with it.
import type { CardProduct } from "./types"

export type Zone = "visage" | "corps"
/** goal: the main priority; goal2: a second one, optional ("" = none) */
export type Answers = {
  /** skin: the face's (or the body's on an old saved answer); bodySkin: the body's; tone: the complexion */
  zone: Zone | "both"; skin: string; bodySkin?: string; tone?: string; goal: string; goal2: string; sensitive: "oui" | "non"; pregnant: "oui" | "non"
  avoid: string[]; budget: string
}

// ---------- the questions ----------

/** Ingredients the client can't bear: a product is left out when its name or its ingredients (web app:
 *  ingrédients clés, ingrédients à surveiller) contain one of the words */
export const AVOID: { value: string; label: string; words: string[] }[] = [
  { value: "carotte", label: "Carotte", words: ["carotte", "carrot"] },
  { value: "papaye", label: "Papaye", words: ["papaye", "papaya"] },
  { value: "niacinamide", label: "Niacinamide (vitamine B3)", words: ["niacinamide", "vitamine b3"] },
  { value: "vitamine-c", label: "Vitamine C", words: ["vitamine c", "vitamin c", "gluta-c", "ascorbique"] },
  { value: "glutathion", label: "Glutathion", words: ["glutathion"] },
  { value: "kojique", label: "Acide kojique", words: ["kojique", "kojic"] },
  { value: "arbutine", label: "Arbutine", words: ["arbutine", "arbutin"] },
  { value: "retinol", label: "Rétinol (vitamine A)", words: ["retinol", "vitamine a", "retinal", "retinyl"] },
  { value: "acides", label: "Acides exfoliants (AHA, glycolique, salicylique)", words: ["aha", "bha", "glycolique", "salicylique", "lactique", "acide de fruit", "acides de fruits"] },
  { value: "curcuma", label: "Curcuma", words: ["curcuma", "turmeric"] },
  { value: "reglisse", label: "Réglisse", words: ["reglisse", "licorice"] },
  { value: "karite", label: "Beurre de karité", words: ["karite", "shea"] },
  { value: "noix", label: "Amande, noix (fruits à coque)", words: ["amande", "noix", "argan", "almond"] },
  { value: "lait", label: "Lait (vache, chèvre)", words: ["lait de chevre", "lait de vache", "lait d'anesse", "goat milk"] },
  { value: "miel", label: "Miel", words: ["miel", "honey"] },
  { value: "escargot", label: "Bave d'escargot", words: ["escargot", "mucine", "snail"] },
  { value: "parfum", label: "Parfum, huiles essentielles", words: ["parfum", "huiles essentielles", "huile essentielle", "tea tree", "arbre a the"] },
]

export type Question = {
  key: keyof Answers; title: string; hint?: string; multi?: boolean
  /** asked only when it matters (the face's skin for a face routine…) */
  show?: (a: Partial<Answers>) => boolean
  options: { value: string; label: string; text?: string; zones?: Zone[]; swatch?: string }[]
}
/** the complexion, lightest to darkest (web app › lib/product-taxonomy.ts › TEINTES). Here "métisse" is lighter
 *  than "claire" (what the shop and its clients mean by it): between "très claire" and "claire". */
export const TONES = [
  { value: "tres-claire", label: "Très claire", swatch: "#F1D3B8" },
  { value: "metisse", label: "Métisse", swatch: "#E4BC97" },
  { value: "claire", label: "Claire", swatch: "#D2A077" },
  { value: "caramel", label: "Caramel", swatch: "#A86B40" },
  { value: "chocolat", label: "Chocolat", swatch: "#7A4A2A" },
  { value: "ebene", label: "Ébène", swatch: "#4A2C1A" },
]
const toneGroup = (v: string | undefined) =>
  v === "tres-claire" || v === "metisse" || v === "claire" ? "light" : v === "chocolat" || v === "ebene" ? "deep" : v ? "medium" : ""
const GOAL_OPTIONS: Question["options"] = [
  { value: "eclaircir", label: "Éclaircir et unifier le teint" },
  { value: "intense", label: "Un éclaircissement intense", text: "Un teint nettement plus clair, des soins plus concentrés" },
  { value: "taches", label: "Atténuer taches et marques", text: "Taches, cicatrices de boutons, genoux et coudes foncés" },
  { value: "acne", label: "Boutons et imperfections", zones: ["visage"] },
  { value: "hydrater", label: "Hydrater et nourrir" },
  { value: "eclat", label: "Un teint lumineux", text: "Une peau qui a l'air reposée, sans forcément l'éclaircir" },
  { value: "age", label: "Rides et fermeté" },
  { value: "vergetures", label: "Vergetures", zones: ["corps"] },
]
export const QUESTIONS: Question[] = [
  { key: "zone", title: "Pour quelle partie ?", options: [
    { value: "visage", label: "Le visage" }, { value: "corps", label: "Le corps" }, { value: "both", label: "Les deux" },
  ] },
  { key: "skin", title: "Comment est la peau de votre visage ?", show: (a) => a.zone !== "corps", hint: "Le test : lavez-vous, n'appliquez rien, et regardez votre peau une heure après.", options: [
    { value: "grasse", label: "Grasse", text: "Elle brille partout, pores visibles" },
    { value: "seche", label: "Sèche", text: "Elle tiraille, rugueuse ou terne" },
    { value: "mixte", label: "Mixte", text: "Elle brille sur le front et le nez, sèche ailleurs" },
    { value: "normale", label: "Normale", text: "Confortable, ni brillante ni sèche" },
    { value: "inconnu", label: "Je ne sais pas", text: "Nous choisirons des soins qui conviennent à toutes les peaux" },
  ] },
  { key: "bodySkin", title: "Et la peau de votre corps ?", show: (a) => a.zone !== "visage", hint: "Après la douche, sans rien appliquer.", options: [
    { value: "seche", label: "Sèche", text: "Elle tiraille, rugueuse, des traces blanches" },
    { value: "normale", label: "Normale", text: "Confortable" },
    { value: "grasse", label: "Grasse", text: "Elle brille, boutons dans le dos ou sur le torse" },
    { value: "inconnu", label: "Je ne sais pas" },
  ] },
  { key: "tone", title: "Votre teint de départ ?", hint: "Votre teint naturel aujourd'hui : nous dosons les soins en fonction.",
    options: TONES.map(({ value, label, swatch }) => ({ value, label, swatch })) },
  { key: "goal", title: "Votre priorité ?", options: GOAL_OPTIONS },
  { key: "goal2", title: "Et en second ?", hint: "Un autre souci à traiter en même temps, si vous en avez un.",
    options: [...GOAL_OPTIONS, { value: "", label: "Rien d'autre" }] },
  { key: "sensitive", title: "Votre peau réagit-elle facilement ?", hint: "Rougeurs, picotements, irritations avec certains produits.", options: [
    { value: "oui", label: "Oui, elle est sensible" }, { value: "non", label: "Non" },
  ] },
  { key: "pregnant", title: "Êtes-vous enceinte ou allaitez-vous ?", hint: "Certains actifs sont déconseillés pendant la grossesse et l'allaitement : nous les écartons.", options: [
    { value: "oui", label: "Oui" }, { value: "non", label: "Non, ou pas concernée" },
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
/** the questions to ask, given the answers so far */
export const questionsFor = (a: Partial<Answers>) => QUESTIONS.filter((q) => !q.show || q.show(a))
export const toneLabel = (v: string | undefined) => TONES.find((t) => t.value === v)?.label ?? ""
export const goalLabel = (v: string) => GOAL_OPTIONS.find((o) => o.value === v)?.label ?? ""
/** the goals offered for the chosen zone ("both": all) */
export const goalFits = (o: { zones?: Zone[] }, zone: Answers["zone"] | undefined) => !o.zones || !zone || zone === "both" || o.zones.includes(zone)

// ---------- reading a product ----------

export const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/œ/g, "oe")
/** short words ("aha", "spf") must be whole words ("sahara" is not "aha"); the longer ones may be part of one */
const contains = (text: string, word: string) => (word.length <= 4 ? new RegExp(`(^|[^a-z0-9])${word}([^a-z0-9]|$)`).test(text) : text.includes(word))
const any = (text: string, words: string[]) => words.some((w) => contains(text, w))

const ACTIVES = {
  retinoid: ["retinol", "retinal", "retinyl", "retinoide"],
  aha: ["aha", "glycolique", "lactique", "mandelique", "acide de fruit", "acides de fruits", "glycolic"],
  bha: ["bha", "salicylique", "salicylic"],
  // medical, harmful without a doctor: the diagnosis never offers them
  forbidden: ["hydroquinone", "benezendiol", "benzenediol", "clobetasol", "betamethasone", "dexamethasone", "corticoide", "tretinoine", "tretinoin", "retin-a"],
}
/** the actives named in the reasons ("Actifs : niacinamide, vitamine C") */
const NAMED: [string, string[]][] = [
  ["niacinamide", ["niacinamide", "vitamine b3"]], ["vitamine C", ["vitamine c", "vitamin c", "ascorbique"]],
  ["acide hyaluronique", ["hyaluronique", "hyaluronic"]], ["rétinol", ACTIVES.retinoid], ["acide salicylique", ACTIVES.bha],
  ["AHA", ACTIVES.aha], ["arbutine", ["arbutine", "arbutin"]], ["glutathion", ["glutathion"]], ["acide kojique", ["kojique", "kojic"]],
  ["céramides", ["ceramide"]], ["centella", ["centella", "cica"]], ["aloe vera", ["aloe"]], ["karité", ["karite", "shea"]],
  ["collagène", ["collagene", "collagen"]], ["réglisse", ["reglisse", "licorice"]], ["acide tranexamique", ["tranexamique"]],
]
const SOOTHING = ["aloe", "centella", "cica", "panthenol", "avoine", "calendula", "camomille", "allantoine", "eau thermale", "thermal"]
/** strong lightening: what its name says ("bleaching", "7 days", "half cast"…) or its actives */
const HARSH = ["bleaching", "super whitening", "extra whitening", "strong whitening", "intense whitening", "7 days", "injection",
  "half cast", "half-cast", "halfcast", "super eclaircissant", "extra eclaircissant", "aha 30", "bha 15", "strong", "whitener", "maxitone"]
const CONCENTRATED = ["glutathion", "kojique", "arbutine", "arbutin", "tranexamique", "glycolique", "intense", "extra", "express", "ultra", "puissant", "super", "strong"]

/** benefits written in the name only (the web app's list is empty for some products) */
const NAME_BENEFITS: [string, string[]][] = [
  ["Éclaircissant", ["eclaircissant", "whitening", "bleaching", "half cast", "half-cast", "lightening", "brightening"]],
  ["Anti-taches", ["anti-taches", "anti taches", "taches", "dark spot", "anti-marques"]],
  ["Hydratant", ["hydratant", "hydrating", "moisturi", "hydra"]],
  ["Nourrissant", ["nourrissant", "nourishing", "beurre", "butter"]],
  ["Anti-acné", ["acne", "anti-boutons", "imperfection", "blemish"]],
  ["Purifiant", ["purifiant", "purifying", "detox"]],
  ["Matifiant", ["matifiant", "mattifying", "oil control", "sebum"]],
  ["Anti-vergetures", ["vergeture", "stretch mark"]],
  ["Anti-âge", ["anti-age", "anti age", "anti-rides", "rides", "age resisting", "wrinkle"]],
  ["Raffermissant", ["raffermissant", "firming", "fermete"]],
  ["Exfoliant", ["exfoliant", "gommage", "scrub", "peeling"]],
  ["Apaisant", ["apaisant", "soothing", "calming"]],
  ["Protection solaire", ["spf", "solaire", "sunscreen", "sun block"]],
]
const SKIN_WORDS: [string, string[]][] = [
  ["Grasse", ["peau grasse", "peaux grasses", "oily", "matifiant", "oil control"]],
  ["Sèche", ["peau seche", "peaux seches", "tres seche", "dry skin"]],
  ["Sensible", ["peau sensible", "peaux sensibles", "sensitive", "tolerance"]],
]
const BODY_WORDS = ["corps", "body", "corporel", "corporelle", "douche", "shower"]
const FACE_WORDS = ["visage", "face", "facial"]
const CLEANSER = ["nettoyant", "lavant", "lavante", "cleanser", "cleansing", "wash", "demaquillant", "micellaire", "savon", "soap", "mousse"]

type Profile = {
  name: string; text: string; benefits: Set<string>; skins: Set<string>; explicitSkins: boolean
  retinoid: boolean; acid: boolean; bha: boolean; forbidden: boolean; harsh: boolean; spf: boolean; lightening: boolean
  soothing: boolean; cleanser: boolean; named: string[]
}
const profiles = new WeakMap<CardProduct, Profile>()
function profile(p: CardProduct): Profile {
  let pr = profiles.get(p)
  if (pr) return pr
  const name = plain(p.name)
  const text = plain(`${p.name} ${p.ingredients.join(" ")}`)
  const benefits = new Set(p.benefits)
  for (const [b, ws] of NAME_BENEFITS) if (any(name, ws)) benefits.add(b)
  const skins = new Set(p.skinTypes)
  for (const [k, ws] of SKIN_WORDS) if (any(name, ws)) skins.add(k)
  pr = {
    name, text, benefits, skins, explicitSkins: p.skinTypes.length > 0,
    retinoid: any(text, ACTIVES.retinoid), acid: any(text, ACTIVES.aha), bha: any(text, ACTIVES.bha),
    forbidden: any(text, ACTIVES.forbidden), harsh: any(name, HARSH),
    spf: benefits.has("Protection solaire"), lightening: benefits.has("Éclaircissant"),
    soothing: benefits.has("Apaisant") || p.skinTypes.includes("Sensible") || any(text, SOOTHING),
    cleanser: any(name, CLEANSER) || benefits.has("Démaquillant"),
    named: NAMED.filter(([, ws]) => any(text, ws)).map(([n]) => n),
  }
  profiles.set(p, pr)
  return pr
}

const hasAvoided = (pr: Profile, avoid: string[]) =>
  avoid.length > 0 && AVOID.filter((x) => avoid.includes(x.value)).some((x) => any(pr.text, x.words))

// ---------- the routines ----------

const GOALS: Record<string, string[]> = {
  eclaircir: ["Éclaircissant", "Unifiant", "Anti-taches"],
  intense: ["Éclaircissant", "Unifiant", "Anti-taches"],
  taches: ["Anti-taches", "Unifiant", "Éclaircissant"],
  acne: ["Anti-acné", "Purifiant", "Matifiant"],
  hydrater: ["Hydratant", "Nourrissant", "Réparateur"],
  eclat: ["Éclat", "Unifiant", "Exfoliant"],
  age: ["Anti-âge", "Raffermissant", "Hydratant"],
  vergetures: ["Anti-vergetures", "Raffermissant", "Nourrissant"],
}
const LIGHTENING_GOALS = ["eclaircir", "intense", "taches"]
/** the skins a skin type gets along with (a product made only for other skins is left out) */
const SKINS: Record<string, { match: string[]; fine: string[] }> = {
  grasse: { match: ["Grasse", "Acnéique", "Mixte"], fine: ["Tous types", "Normale", "Sensible", "À taches / hyperpigmentée"] },
  seche: { match: ["Sèche", "Déshydratée"], fine: ["Tous types", "Normale", "Sensible", "Mature", "À taches / hyperpigmentée"] },
  mixte: { match: ["Mixte"], fine: ["Grasse", "Normale", "Tous types", "Sensible", "Déshydratée", "Acnéique", "À taches / hyperpigmentée"] },
  normale: { match: ["Normale", "Tous types"], fine: ["Mixte", "Sèche", "Déshydratée", "Sensible", "Mature", "À taches / hyperpigmentée"] },
  inconnu: { match: ["Tous types"], fine: ["Normale", "Sensible", "Mixte", "Déshydratée", "À taches / hyperpigmentée", "Mature"] },
}
const SKIN_LABEL: Record<string, string> = { grasse: "les peaux grasses", seche: "les peaux sèches", mixte: "les peaux mixtes", normale: "les peaux normales" }

type Ctx = {
  a: Answers; wanted: string[]; second: string[]; lighten: boolean; sensitive: boolean; pregnant: boolean
  bodySkin: string; tone: string
  goals: string[]; budget: number
}
/** leaveOn: stays on the skin (its actives count in the routine); a cleanser is rinsed off */
type StepDef = {
  id: string; title: string; when: string; forms: string[]; leaveOn: boolean
  optional?: boolean; essential?: boolean | ((c: Ctx) => boolean)
  include?: (c: Ctx) => boolean
  fits?: (pr: Profile, p: CardProduct, c: Ctx) => boolean
}
const notCleanser = (pr: Profile) => !pr.cleanser && !any(pr.name, ["contour", "yeux", "masque", "mask", "gommage", "scrub"])

const ROUTINES: Record<Zone, StepDef[]> = {
  visage: [
    { id: "nettoyer", title: "Nettoyer", when: "Matin et soir", forms: ["Savon", "Gel", "Mousse", "Eau micellaire"], leaveOn: false, essential: true,
      fits: (pr, p) => p.form !== "Gel" || pr.cleanser },
    { id: "tonifier", title: "Tonifier", when: "Matin et soir, après le nettoyage", forms: ["Tonique", "Lotion"], leaveOn: true, optional: true,
      include: (c) => ["grasse", "mixte"].includes(c.a.skin) || c.goals.some((g) => ["acne", "eclat", "taches"].includes(g)),
      fits: (pr, p) => p.form === "Tonique" || any(pr.name, ["tonique", "toner", "lotion tonique"]) },
    { id: "traiter", title: "Traiter", when: "Le soir", forms: ["Sérum", "Contour des yeux"], leaveOn: true,
      fits: (_, p, c) => p.form !== "Contour des yeux" || c.goals.includes("age") },
    { id: "hydrater", title: "Hydrater", when: "Matin et soir", forms: ["Crème", "Gel", "Lotion", "Baume", "Huile"], leaveOn: true, essential: true,
      fits: (pr, p, c) => notCleanser(pr) && !(p.form === "Lotion" && any(pr.name, ["tonique", "toner"])) && (p.form !== "Huile" || c.a.skin === "seche") },
    { id: "proteger", title: "Protéger", when: "Le matin, en dernier", forms: ["Crème", "Lotion", "Gel", "Lait", "Huile", "Sérum"], leaveOn: true,
      essential: (c) => c.lighten || c.goals.some((g) => ["eclat", "age"].includes(g)),
      fits: (pr) => pr.spf && notCleanser(pr) },
    { id: "semaine", title: "Soin de la semaine", when: "1 à 2 fois par semaine", forms: ["Gommage", "Masque"], leaveOn: false, optional: true,
      include: (c) => c.goals.some((g) => ["acne", "eclat", "eclaircir", "intense", "taches", "hydrater"].includes(g)),
      fits: (_, p, c) => !c.sensitive || p.form === "Masque" },
  ],
  corps: [
    { id: "laver", title: "Laver", when: "À la douche", forms: ["Gel douche", "Savon"], leaveOn: false, essential: true,
      fits: (pr) => !any(pr.name, ["intime", "intimate"]) },
    { id: "exfolier", title: "Exfolier", when: "1 à 2 fois par semaine, à la douche", forms: ["Gommage"], leaveOn: false, optional: true,
      include: (c) => !c.sensitive || c.goals.some((g) => ["eclat", "taches"].includes(g)) },
    { id: "soigner", title: "Soigner", when: "Après la douche, matin et soir", forms: ["Lait", "Lotion", "Crème", "Beurre"], leaveOn: true, essential: true,
      fits: notCleanser },
    { id: "renforcer", title: "Renforcer", when: "Le soir, sur les zones à traiter", forms: ["Huile", "Sérum", "Baume"], leaveOn: true, optional: true,
      include: (c) => c.goals.some((g) => ["vergetures", "intense", "taches", "eclaircir", "hydrater", "age"].includes(g)) || c.bodySkin === "seche",
      fits: notCleanser },
  ],
}

export type Planned = {
  id: string; title: string; when: string; optional?: boolean; essential: boolean
  candidates: CardProduct[]; main: CardProduct | null; alt: CardProduct[]
  /** why each candidate was chosen (product id → reasons, best first) */
  why: Record<string, string[]>
}

/** The budget of the whole routine (F): "min-max", "any" = none; an old saved answer "15000" is a maximum */
const budgetOf = (b: string | undefined) => (b === "any" || !b ? Infinity : Number(b.includes("-") ? b.split("-")[1] : b))
/** a little over the budget is accepted rather than losing a good care */
const MARGIN = 1.1

/** When to apply this product: what it is (sun cream: morning; retinol, acids: evening), else what the web
 *  app says (Matin / Soir), else the step's habit */
export function momentFor(step: { id: string; when: string }, p: CardProduct) {
  const pr = profile(p)
  if (step.id === "nettoyer" || step.id === "laver" || step.id === "semaine" || step.id === "exfolier") return step.when
  if (pr.spf) return "Le matin, en dernier"
  if (pr.retinoid || pr.acid) return "Le soir uniquement"
  const m = p.moments ?? []
  if (m.includes("Soir") && !m.includes("Matin")) return "Le soir"
  if (m.includes("Matin") && !m.includes("Soir")) return "Le matin"
  return step.when
}

export function recommend(catalog: CardProduct[], answers: Answers) {
  const a: Answers = { ...answers, avoid: answers.avoid ?? [], pregnant: answers.pregnant ?? "non", goal2: answers.goal2 ?? "" }
  const goals = [a.goal, a.goal2].filter((g, i) => g && (i === 0 || g !== a.goal))
  const c: Ctx = {
    a, goals,
    wanted: GOALS[a.goal] ?? [],
    second: (a.goal2 && a.goal2 !== a.goal ? GOALS[a.goal2] : null) ?? [],
    lighten: goals.some((g) => LIGHTENING_GOALS.includes(g)),
    sensitive: a.sensitive === "oui",
    pregnant: a.pregnant === "oui",
    bodySkin: a.bodySkin || a.skin || "inconnu",
    tone: toneGroup(a.tone),
    budget: budgetOf(a.budget),
  }
  const zones: Zone[] = a.zone === "both" ? ["visage", "corps"] : [a.zone]
  const used = new Set<string>()

  const result = zones.map((zone) => {
    const universe = zone === "visage" ? "Visage" : "Corps"
    // the skin of this zone (the face and the body may differ)
    const sk = zone === "corps" ? c.bodySkin : a.skin || "inconnu"
    const skin = SKINS[sk] ?? SKINS.inconnu
    // actives already on the skin in this routine (retinol and acids are not mixed)
    const on = { retinoid: false, acid: false, spf: false }
    const steps: Planned[] = []
    for (const step of ROUTINES[zone]) {
      if (step.include && !step.include(c)) continue
      if (step.id === "proteger" && on.spf) continue // the moisturiser already protects
      const why: Record<string, string[]> = {}
      const scored: { p: CardProduct; s: number; soft: boolean }[] = []
      for (const p of catalog) {
        if (!p.inStock || p.universe !== universe || !step.forms.includes(p.form) || p.price > c.budget) continue
        const pr = profile(p)
        // ---- never ----
        if (pr.forbidden || hasAvoided(pr, a.avoid)) continue
        // the zone, strictly: no body product in the face routine, no face-only product on the body
        if (zone === "visage" && any(pr.name, BODY_WORDS)) continue
        if (zone === "corps" && any(pr.name, FACE_WORDS) && !any(pr.name, BODY_WORDS)) continue
        if (step.fits && !step.fits(pr, p, c)) continue
        if (c.pregnant && (pr.retinoid || pr.bha || pr.harsh)) continue
        if (c.sensitive && pr.harsh) continue
        // a product made only for other skins (explicit in the web app)
        if (pr.explicitSkins && sk !== "inconnu" && ![...pr.skins].some((k) => skin.match.includes(k) || skin.fine.includes(k))) continue

        // ---- rather not (used only when nothing else fits the step) ----
        let soft = false
        if (!c.lighten && pr.lightening) soft = true // lightening for someone who did not ask for it
        if (sk === "seche" && (pr.benefits.has("Matifiant") || pr.skins.has("Grasse") && !pr.skins.has("Sèche"))) soft = true
        if (sk === "grasse" && zone === "visage" && (["Huile", "Beurre", "Baume"].includes(p.form) || pr.skins.has("Sèche") && !pr.skins.has("Grasse"))) soft = true
        // one exfoliating active on the skin at a time: retinol and acids are not mixed, nor two acids
        if (step.leaveOn && ((pr.retinoid && (on.acid || on.retinoid)) || ((pr.acid || pr.bha) && (on.retinoid || on.acid)))) soft = true
        // soap dries a dry or sensitive face
        if (zone === "visage" && step.id === "nettoyer" && p.form === "Savon" && (sk === "seche" || c.sensitive)) soft = true
        // the sun cream has its own step: the moisturiser rather without
        if (zone === "visage" && ["hydrater", "tonifier"].includes(step.id) && pr.spf) soft = true
        // strong lightening marbles a deep complexion and burns a light one: progressive care rather
        if (c.lighten && pr.harsh && (c.tone === "deep" || c.tone === "light")) soft = true
        if (step.leaveOn && c.sensitive && (pr.retinoid || pr.acid || pr.bha) && (on.acid || on.retinoid)) soft = true

        // ---- how well it answers ----
        let s = 0
        const r: string[] = []
        let goalHit = false
        for (const b of c.wanted) if (pr.benefits.has(b)) { s += b === c.wanted[0] ? 4 : 2; goalHit = true }
        if (goalHit) r.push(`Pour : ${goalLabel(a.goal).toLowerCase()}`)
        let secondHit = false
        for (const b of c.second) if (pr.benefits.has(b)) { s += b === c.second[0] ? 2.5 : 1; secondHit = true }
        if (secondHit) r.push(`Agit aussi sur : ${goalLabel(a.goal2).toLowerCase()}`)

        if ([...pr.skins].some((k) => skin.match.includes(k) && k !== "Tous types")) {
          s += pr.explicitSkins ? 3 : 2
          if (SKIN_LABEL[sk]) r.push(`Pensé pour ${SKIN_LABEL[sk]}`)
        } else if (pr.skins.has("Tous types")) { s += 1; r.push("Convient à toutes les peaux") }

        if (c.sensitive) {
          if (pr.soothing) { s += 2.5; r.push("Doux et apaisant") }
          if (step.leaveOn && (pr.retinoid || pr.acid)) s -= 2
        }
        if (c.lighten && c.tone === "deep" && pr.benefits.has("Unifiant")) { s += 1.5; r.push("Unifie sans marbrer le teint") }
        if (c.lighten && c.tone === "light" && (pr.benefits.has("Éclat") || pr.benefits.has("Unifiant"))) { s += 1.5; r.push("Unifie un teint déjà clair") }
        if (c.pregnant && p.targets.includes("Femme enceinte")) { s += 2; r.push("Adapté à la grossesse") }
        if (a.goal === "intense" && pr.lightening && any(pr.text, CONCENTRATED)) { s += 3; r.push("Formule concentrée") }
        // a dry face is not washed with soap; an oily one is not left with a rich cream
        if (sk === "seche" && zone === "visage" && step.id === "nettoyer" && p.form === "Savon") s -= 3
        if (sk === "seche" && pr.benefits.has("Purifiant")) s -= 1.5
        if (sk === "seche" && zone === "corps" && step.id === "laver" && any(pr.name, ["surgras", "huile lavante", "nourrissant", "shea", "karite", "lait"])) { s += 1.5; r.push("Lave sans dessécher") }
        if (sk === "grasse" && pr.benefits.has("Nourrissant") && !pr.benefits.has("Matifiant")) s -= 1
        if (step.id === "proteger") r.unshift("Protection solaire (SPF)")
        else if (pr.spf && (c.lighten || zone === "corps")) { s += 1; r.push("Avec protection solaire") }
        if (pr.named.length) r.push(`Actifs : ${pr.named.slice(0, 2).join(", ")}`)
        if (p.image) s += 1.5
        if (p.bestseller || p.featured) { s += 1; r.push("Un best-seller de nos boutiques") }
        if ((p.rating ?? 0) >= 4.8) s += 0.5

        if (s <= 1.5 && step.id !== "proteger") continue
        why[p.id] = r.slice(0, 3)
        scored.push({ p, s, soft })
      }
      const firm = scored.filter((x) => !x.soft)
      const candidates = (firm.length ? firm : scored)
        .sort((x, y) => y.s - x.s)
        .map((x) => x.p)
        .filter((p) => !used.has(p.id))
        .slice(0, 8)
      const main = candidates[0] ?? null
      if (!main) continue
      used.add(main.id)
      if (step.leaveOn) {
        const pr = profile(main)
        on.retinoid ||= pr.retinoid
        on.acid ||= pr.acid || pr.bha
        on.spf ||= pr.spf && step.id === "hydrater" // a moisturiser with SPF takes the place of the sun cream
      }
      const essential = typeof step.essential === "function" ? step.essential(c) : !!step.essential
      steps.push({ id: step.id, title: step.title, when: step.when, optional: step.optional, essential, candidates, main, alt: candidates.slice(1, 3), why })
    }
    return { zone, steps }
  })
  return { ...fitBudget(result, c.budget), advice: adviceFor(c, result) }
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
    const rank = (s: Planned) => (s.optional ? 0 : 1)
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

// ---------- the advice that goes with the routine ----------

const TIPS: Record<string, string[]> = {
  eclaircir: [
    "Le soin solaire chaque matin est indispensable : sans lui, le teint refonce et les taches reviennent.",
    "Comptez 4 à 8 semaines d'utilisation régulière pour voir le teint s'unifier.",
  ],
  intense: [
    "Faites un test 48 h sur le pli du coude avant la première application.",
    "N'ajoutez pas d'autres éclaircissants à cette routine : trop d'actifs abîment la peau et la font foncer.",
    "Fuyez les produits à l'hydroquinone ou aux corticoïdes (clobétasol) : nous ne les proposons jamais.",
  ],
  taches: [
    "Protégez-vous du soleil chaque jour : c'est lui qui fonce les taches.",
    "Ne grattez pas les boutons ni les croûtes : chaque marque devient une tache.",
    "Les taches s'estompent en 6 à 12 semaines, avec régularité.",
  ],
  acne: [
    "Ne percez pas vos boutons : ils laissent des marques.",
    "Même grasse, la peau a besoin d'être hydratée : sans soin, elle produit encore plus de sébum.",
    "Changez votre taie d'oreiller chaque semaine.",
  ],
  hydrater: [
    "Appliquez votre soin sur une peau encore légèrement humide : il retient mieux l'eau.",
    "Lavez-vous à l'eau tiède : l'eau chaude dessèche.",
  ],
  eclat: [
    "Exfoliez 1 à 2 fois par semaine, pas plus : la peau reste lumineuse sans s'irriter.",
    "Buvez de l'eau et dormez suffisamment : c'est aussi sur le visage que ça se voit.",
  ],
  age: [
    "Le soin solaire est le meilleur anti-rides : le soleil fait 80 % du vieillissement visible.",
    "Rétinol : seulement le soir, 2 à 3 soirs par semaine pour commencer.",
  ],
  vergetures: [
    "Massez la zone chaque jour, en mouvements circulaires, jusqu'à ce que le soin pénètre.",
    "Les vergetures récentes (rouges ou violettes) répondent bien mieux que les anciennes (blanches).",
  ],
}

function adviceFor(c: Ctx, zones: { zone: Zone; steps: Planned[] }[]) {
  const out: string[] = []
  if (c.pregnant) out.push("Grossesse et allaitement : nous avons écarté rétinol, acide salicylique et éclaircissants forts. Montrez cette routine à votre médecin ou sage-femme.")
  if (c.sensitive) out.push("Peau sensible : commencez un seul nouveau soin à la fois, à quelques jours d'intervalle.")
  if (c.sensitive && c.a.goal === "intense") out.push("Votre peau est sensible : nous avons choisi des éclaircissants efficaces mais tolérés plutôt que les plus forts.")
  if (c.lighten && c.tone === "deep") out.push("Sur un teint foncé, un éclaircissement progressif garde un teint uniforme : appliquez aussi sur les mains, les pieds, les genoux et les coudes, sinon ils restent plus foncés.")
  if (c.lighten && c.tone === "light") out.push("Votre teint est déjà clair : nous visons un teint uniforme et lumineux, sans produits forts qui risqueraient de l'irriter.")
  for (const g of c.goals) for (const t of TIPS[g] ?? []) if (!out.includes(t)) out.push(t)
  const acids = zones.some((z) => z.steps.some((s) => s.main && (profile(s.main).retinoid || profile(s.main).acid)))
  if (acids) out.push("Votre routine contient un actif exfoliant (rétinol ou acide) : le soir seulement, et le soin solaire le lendemain matin.")
  return out.slice(0, 6)
}
