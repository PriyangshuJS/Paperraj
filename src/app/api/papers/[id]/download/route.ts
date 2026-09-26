import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { papers } from "@/db/schema";
import { fail, handleError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { getPaperById } from "@/lib/papers";
import { createSignedUrl, isSupabaseStorage, readObject } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Serve the stored object. `download` also increments the download counter. */
export async function servePaperFile(id: string, mode: "view" | "download") {
  const paper = await getPaperById(id);
  if (!paper) return fail("That paper could not be found.", 404);
  const user = await getCurrentUser();
  const isPrivileged = Boolean(user && (user.role === "admin" || user.id === paper.ownerId));
  if (paper.status !== "APPROVED" && !isPrivileged) {
    return fail("This paper is awaiting approval and is not public yet.", 403);
  }

  if (mode === "download") {
    await db
      .update(papers)
      .set({ downloadCount: sql`${papers.downloadCount} + 1` })
      .where(eq(papers.id, paper.id));
  }

  const disposition = mode === "download" ? "attachment" : "inline";
  const asciiName = paper.fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");

  if (isSupabaseStorage()) {
    const signed = await createSignedUrl(
      paper.storagePath,
      mode === "download" ? 300 : 3600,
    );
    if (signed) {
      const url = new URL(signed);
      url.searchParams.set("download", mode === "download" ? paper.fileName : "0");
      return Response.redirect(url.toString(), 302);
    }
  }

  const object = await readObject(paper.id, paper.storagePath);
  if (!object) return fail("The stored file is no longer available.", 404);

  return new Response(new Uint8Array(object.data), {
    headers: {
      "content-type": paper.mimeType,
      "content-length": String(object.data.byteLength),
      "content-disposition": `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(
        paper.fileName,
      )}`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    return await servePaperFile(id, "download");
  } catch (error) {
    return handleError(error);
  }
}
