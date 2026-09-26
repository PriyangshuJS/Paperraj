/**
 * Storage abstraction.
 *
 * • Supabase Storage (private bucket) when SUPABASE_URL + service role key exist.
 * • Postgres `file_blobs` fallback so the platform runs locally / in CI without
 *   external services. Never enabled when a service-role key is present, so no
 *   production deployment silently falls back.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { fileBlobs } from "@/db/schema";

const SUPABASE_URL = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(
  /\/$/,
  "",
);
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "paperraj-papers";

export function isSupabaseStorage(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_KEY);
}

function authHeaders(extra: Record<string, string> = {}): HeadersInit {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    ...extra,
  };
}

export async function putObject(
  paperId: string,
  path: string,
  data: Buffer,
  contentType: string,
): Promise<void> {
  if (isSupabaseStorage()) {
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${path}`,
      {
        method: "POST",
        headers: authHeaders({ "content-type": contentType, "x-upsert": "false" }),
        body: new Uint8Array(data),
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new StorageError(`Upload to object storage failed (${res.status}). ${text.slice(0, 200)}`);
    }
    return;
  }
  await db.insert(fileBlobs).values({ paperId, data });
}

export async function readObject(
  paperId: string,
  path: string,
): Promise<{ data: Buffer; contentType: string } | null> {
  if (isSupabaseStorage()) {
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${path}`,
      { headers: authHeaders(), cache: "no-store" },
    );
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return { data: buf, contentType: res.headers.get("content-type") ?? "application/octet-stream" };
  }
  const rows = await db
    .select({ data: fileBlobs.data })
    .from(fileBlobs)
    .where(eq(fileBlobs.paperId, paperId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return { data: Buffer.from(row.data), contentType: "application/octet-stream" };
}

/** Signed, time-limited URL — only issued for papers the caller may read. */
export async function createSignedUrl(path: string, expiresIn = 3600): Promise<string | null> {
  if (!isSupabaseStorage()) return null;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${STORAGE_BUCKET}/${path}`, {
    method: "POST",
    headers: authHeaders({ "content-type": "application/json" }),
    body: JSON.stringify({ expiresIn }),
  });
  if (!res.ok) return null;
  const json = (await res.json().catch(() => null)) as { signedURL?: string } | null;
  if (!json?.signedURL) return null;
  return `${SUPABASE_URL}/storage/v1${json.signedURL}`;
}

export async function deleteObject(paperId: string, path: string): Promise<void> {
  if (isSupabaseStorage()) {
    await fetch(
      `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${path}`,
      { method: "DELETE", headers: authHeaders() },
    ).catch(() => undefined);
    return;
  }
  await db.delete(fileBlobs).where(eq(fileBlobs.paperId, paperId)).catch(() => undefined);
}

/** Replace the stored bytes without touching the metadata row. */
export async function replaceObject(
  paperId: string,
  path: string,
  data: Buffer,
  contentType: string,
): Promise<void> {
  if (isSupabaseStorage()) {
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${path}`,
      {
        method: "PUT",
        headers: authHeaders({ "content-type": contentType, "x-upsert": "true" }),
        body: new Uint8Array(data),
      },
    );
    if (!res.ok) throw new StorageError("Replacing the stored file failed.");
    return;
  }
  await db
    .insert(fileBlobs)
    .values({ paperId, data })
    .onConflictDoUpdate({ target: fileBlobs.paperId, set: { data } });
}

export class StorageError extends Error {}
