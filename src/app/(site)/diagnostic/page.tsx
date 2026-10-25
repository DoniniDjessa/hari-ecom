import type { Metadata } from "next"
import { SkinQuiz } from "@/components/SkinQuiz"

export const metadata: Metadata = {
  title: "Diagnostic de peau gratuit : votre routine en 5 questions",
  description: "Répondez à 5 questions sur votre peau : nous composons votre routine visage ou corps avec des soins authentiques, livrés à Abidjan.",
  alternates: { canonical: "/diagnostic" },
}

export default function Diagnostic() {
  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 90 }}>
      <span className="script text-gold">Diagnostic de peau</span>
      <p style={{ margin: "6px 0 34px", color: "var(--text-secondary)", maxWidth: 620 }}>
        5 questions, 1 minute : nous composons votre routine avec les soins de nos boutiques.
      </p>
      <SkinQuiz />
    </div>
  )
}
