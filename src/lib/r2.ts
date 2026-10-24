import "server-only"
import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { randomUUID } from "node:crypto"

// Cloudflare R2, the web app's bucket. The site only reads and writes under haritest/ecom/ (website photos);
// the backoffice's images go to haritest/ecom/site/.
export const r2 = new S3Client({
  region: "auto",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
})

export const isEcomKey = (key: string) => key.startsWith("haritest/ecom/") && !key.includes("..") && /^[\w\-./]+$/.test(key)

export async function getObject(key: string) {
  const obj = await r2.send(new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }))
  return { bytes: await obj.Body!.transformToByteArray(), contentType: obj.ContentType || "image/webp" }
}

// accepted types, recognised from their first bytes (the declared type can lie)
const SIGNATURES: Record<string, (b: Uint8Array) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/webp": (b) => String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP",
}
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

/** Every image sent from the backoffice, newest first (to pick one again without sending it twice) */
export async function listSiteImages(): Promise<{ src: string; at: string }[]> {
  const out: { src: string; at: string }[] = []
  let token: string | undefined
  do {
    const page = await r2.send(new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET, Prefix: "haritest/ecom/site/", ContinuationToken: token }))
    for (const o of page.Contents ?? []) if (o.Key) out.push({ src: `/api/img/${o.Key}`, at: o.LastModified?.toISOString() ?? "" })
    token = page.IsTruncated ? page.NextContinuationToken : undefined
  } while (token)
  return out.sort((a, b) => b.at.localeCompare(a.at))
}

/** Saves an image of the backoffice; returns its public path (/api/img/…) */
export async function putSiteImage(bytes: Uint8Array): Promise<string> {
  const type = Object.keys(SIGNATURES).find((t) => SIGNATURES[t](bytes))
  if (!type) throw new Error("Format non accepté (JPEG, PNG ou WebP)")
  if (bytes.length > MAX_UPLOAD_BYTES) throw new Error("Image trop lourde (4 Mo maximum)")
  const key = `haritest/ecom/site/${Date.now()}-${randomUUID()}.${EXT[type]}`
  await r2.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: bytes, ContentType: type }))
  return `/api/img/${key}`
}
