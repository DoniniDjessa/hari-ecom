import { Fira_Sans_Condensed, Nunito_Sans } from "next/font/google"

// Backoffice: the imo-platform look (Phoenix): Nunito Sans, small bold labels, Fira Sans Condensed titles
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-nunito" })
const fira = Fira_Sans_Condensed({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-fira" })

export default function BackofficeLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${nunito.variable} ${fira.variable}`}>{children}</div>
}
