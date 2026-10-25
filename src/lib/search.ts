// Search that forgives: accents, capitals, French spelling by ear ("eclairsissante" finds
// "éclaircissante", "fone" finds "phone") and one or two typos depending on the length of the word.
// Used by the instant search (suggestions while typing) and by the shop's search field.
import type { CardProduct } from "./types"

export const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/œ/g, "oe").replace(/æ/g, "ae")

/** French by ear: the letters that sound alike written the same way, double letters made single */
const phonetic = (w: string) =>
  w.replace(/ph/g, "f").replace(/qu/g, "k").replace(/c([eiy])/g, "s$1").replace(/[ck]/g, "k").replace(/z/g, "s")
    .replace(/y/g, "i").replace(/(eau|au)/g, "o").replace(/h/g, "").replace(/(.)\1+/g, "$1")

const sounds = new Map<string, string>()
/** phonetic() remembered: the catalogue words come back at every keystroke */
const sound = (w: string) => {
  let v = sounds.get(w)
  if (v === undefined) sounds.set(w, (v = phonetic(w)))
  return v
}

const words = (s: string) => norm(s).split(/[^a-z0-9%]+/).filter((w) => w.length > 0)

/** Edit distance with swaps (Damerau), stopped as soon as it exceeds `max` */
function distance(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1
  const prev2: number[] = []
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let v = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1)
      row.push(v)
      best = Math.min(best, v)
    }
    if (best > max) return max + 1
    prev2.splice(0, prev2.length, ...prev)
    prev = row
  }
  return prev[b.length]
}

/** How well one typed word matches one word of the product (0: not at all) */
function wordScore(q: string, w: string) {
  if (w === q) return 4
  if (w.startsWith(q)) return q.length >= 2 ? 3 : 1
  if (q.length >= 3 && w.includes(q)) return 2
  if (q.length < 4) return 0
  const pq = sound(q)
  const pw = sound(w)
  if (pw === pq || (pq.length >= 4 && pw.startsWith(pq))) return 2.5
  const max = q.length >= 8 ? 2 : 1
  // compare with the start of the word too: a word typed halfway with a typo
  const head = pw.slice(0, pq.length + 1)
  return Math.min(distance(pq, pw, max), distance(pq, head, max)) <= max ? 1.5 : 0
}

export type Indexed = { product: CardProduct; name: string[]; other: string[] }

export const indexProducts = (products: CardProduct[]): Indexed[] =>
  products.map((p) => ({
    product: p,
    name: words(`${p.name} ${p.brand}`),
    other: words(`${p.form} ${p.universe} ${p.benefits.join(" ")} ${p.skinTypes.join(" ")} ${p.targets.join(" ")} ${p.code}`),
  }))

/** Products matching every typed word, best first (words of the name count more). Each distinct word of the
 *  catalogue is scored once per typed word (≈ 3 000 words, not 600 products × their words). */
export function searchProducts(index: Indexed[], query: string, limit = Infinity): CardProduct[] {
  const qs = words(query).filter((w) => w.length > 1 || /\d/.test(w))
  if (!qs.length) return []
  const caches = qs.map(() => new Map<string, number>())
  const score = (i: number, w: string) => {
    let v = caches[i].get(w)
    if (v === undefined) caches[i].set(w, (v = wordScore(qs[i], w)))
    return v
  }
  const scored: { p: CardProduct; s: number }[] = []
  for (const it of index) {
    let total = 0
    let ok = true
    for (let i = 0; i < qs.length; i++) {
      let best = 0
      for (const w of it.name) best = Math.max(best, score(i, w) * 1.4)
      if (best < 4) for (const w of it.other) best = Math.max(best, score(i, w))
      if (!best) { ok = false; break }
      total += best
    }
    if (ok) scored.push({ p: it.product, s: total + (it.product.image ? 0.5 : 0) + (it.product.inStock ? 0.5 : 0) })
  }
  return scored.sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.p)
}

/** Labels (brands, needs…) matching the query, best first */
export function searchLabels<T extends { label: string }>(items: T[], query: string, limit = 4): T[] {
  const qs = words(query)
  if (!qs.length) return []
  return items
    .map((it) => {
      const ws = words(it.label)
      let total = 0
      for (const q of qs) {
        const best = Math.max(0, ...ws.map((w) => wordScore(q, w)))
        if (!best) return { it, s: 0 }
        total += best
      }
      return { it, s: total }
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.it)
}
