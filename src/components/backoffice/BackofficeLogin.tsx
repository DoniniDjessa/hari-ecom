"use client"

import { useActionState } from "react"
import Image from "next/image"
import { login } from "@/app/backoffice/actions"
import styles from "./Backoffice.module.css"

export function BackofficeLogin() {
  const [state, action, pending] = useActionState(login, null)
  return (
    <div className={styles.loginPage}>
      <form action={action} className={styles.login}>
        <div className={styles.loginBrand}>
          <Image src="/haristore-mark.png" alt="" width={40} height={26} />
          <span><strong>Hari Store</strong><small>Backoffice du site</small></span>
        </div>
        <div>
          <h1>Connexion</h1>
        </div>
        <p>Entrez le code d&apos;accès pour modifier les textes et les images du site.</p>
        <label className={styles.field}>
          <span className={styles.label}>Code d&apos;accès</span>
          <input
            name="code"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            autoFocus
            placeholder="••••"
            className={`${styles.input} ${styles.codeInput}`}
          />
        </label>
        {state?.error && <span role="alert" className={styles.badgeError}>{state.error}</span>}
        <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={pending}>{pending ? "Vérification…" : "Entrer"}</button>
      </form>
    </div>
  )
}
