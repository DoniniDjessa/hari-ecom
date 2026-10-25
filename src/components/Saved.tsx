"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { CardProduct } from "@/lib/types"
import { track } from "@/lib/track"

// What the visitor keeps without an account, in the browser: the favourites (hari-favs) and the products
// seen lately (hari-recent, 16 at most, newest first). One provider: every heart and counter stays in step,
// across tabs too. useCatalog() loads the light catalogue (/api/catalog) once, for the pages that need
// products by id (favourites, recently seen) and the instant search.
const FAVS = "hari-favs"
const RECENT = "hari-recent"
const MAX_RECENT = 16

type Saved = {
  ready: boolean
  favourites: string[]
  isFavourite: (id: string) => boolean
  toggleFavourite: (p: { id: string; name: string; price: number }) => void
  recent: string[]
  see: (id: string) => void
}

const SavedContext = createContext<Saved | null>(null)

const read = (key: string): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "[]")
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 200) : []
  } catch {
    return []
  }
}
const write = (key: string, ids: string[]) => {
  try { localStorage.setItem(key, JSON.stringify(ids)) } catch {}
}

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [favourites, setFavourites] = useState<string[]>([])
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    setFavourites(read(FAVS))
    setRecent(read(RECENT))
    setReady(true)
    const sync = (e: StorageEvent) => {
      if (e.key === FAVS) setFavourites(read(FAVS))
      if (e.key === RECENT) setRecent(read(RECENT))
    }
    window.addEventListener("storage", sync)
    return () => window.removeEventListener("storage", sync)
  }, [])

  const toggleFavourite = useCallback((p: { id: string; name: string; price: number }) => {
    setFavourites((list) => {
      const on = list.includes(p.id)
      const next = on ? list.filter((x) => x !== p.id) : [p.id, ...list]
      write(FAVS, next)
      if (!on) track("add_to_wishlist", { value: p.price, items: [{ id: p.id, name: p.name, price: p.price }] })
      return next
    })
  }, [])

  const see = useCallback((id: string) => {
    setRecent((list) => {
      const next = [id, ...list.filter((x) => x !== id)].slice(0, MAX_RECENT)
      write(RECENT, next)
      return next
    })
  }, [])

  const value = useMemo<Saved>(() => ({
    ready, favourites, isFavourite: (id) => favourites.includes(id), toggleFavourite, recent, see,
  }), [ready, favourites, toggleFavourite, recent, see])

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>
}

const useSaved = () => {
  const v = useContext(SavedContext)
  if (!v) throw new Error("useSaved outside SavedProvider")
  return v
}
export const useFavourites = () => {
  const { ready, favourites, isFavourite, toggleFavourite } = useSaved()
  return { ready, favourites, isFavourite, toggleFavourite }
}
export const useRecent = () => {
  const { ready, recent, see } = useSaved()
  return { ready, recent, see }
}

/** The light catalogue, loaded once per visit (null while loading) */
let catalog: Promise<CardProduct[]> | null = null
export function loadCatalog() {
  if (!catalog) catalog = fetch("/api/catalog").then((r) => (r.ok ? r.json() : Promise.reject(r.status))).catch(() => { catalog = null; return [] })
  return catalog
}
export function useCatalog(enabled = true) {
  const [products, setProducts] = useState<CardProduct[] | null>(null)
  useEffect(() => {
    if (!enabled) return
    let alive = true
    loadCatalog().then((p) => alive && setProducts(p))
    return () => { alive = false }
  }, [enabled])
  return products
}
