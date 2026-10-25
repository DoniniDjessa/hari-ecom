import { ldJson } from "@/lib/seo"

/** schema.org data for search engines (one or several objects) */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(data) }} />
}
