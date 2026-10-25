import type { Metadata } from "next"
import { FavouritesList, RecentlyViewed } from "@/components/SavedRows"

export const metadata: Metadata = { title: "Mes favoris", robots: { index: false } }

export default function Favoris() {
  return (
    <>
      <div className="container" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <span className="script text-gold">Gardés pour plus tard</span>
        <h1 className="section-title">Mes favoris.</h1>
        <div style={{ marginTop: 30 }}>
          <FavouritesList />
        </div>
      </div>
      <RecentlyViewed />
    </>
  )
}
