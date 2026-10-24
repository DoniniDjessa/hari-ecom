import "server-only"
import { createClient } from "@supabase/supabase-js"

// The catalogue lives in the web app's Supabase (haritest, tables hari-*). The site reads it (and the
// backoffice writes its settings) on the server only, with the service key: nothing of the database is
// reachable from the browser.
export const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
