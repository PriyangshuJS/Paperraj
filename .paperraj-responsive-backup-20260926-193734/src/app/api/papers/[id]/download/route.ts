import JSZip from "jszip";
import { eq, sql, asc } from "drizzle-orm";
import { db } from "@/db";
import { paperPages, papers } from "@/db/schema";
import { fail, handleError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { getPaperById } from "@/lib/papers";
import { readObject } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Serve the stored object or download all pages as a ZIP. */
export async function servePaperFile(id: string, mode: "view" | "download") {
  const paper = await getPaperById(id);
  if (!paper) return fail("That paper could not be found.", 404);

  const user = await getCurrentUser();
  const isPrivileged = Boolean(
    user && (user.role === "admin" || user.id === paper.ownerId),
  );

  if (paper.status !== "APPROVED" && !isPrivileged) {
    return fail("This paper is awaiting approval and is not public yet.", 403);
  }

  if (mode === "download") {
    await db
      .update(papers)
      .set({ downloadCount: sql`${papers.downloadCount} + 1` })
      .where(eq(papers.id, paper.id));
  }

  // Multi-page image paper: package every page into one ZIP.
  if (paper.fileExt.toLowerCase() === "images") {
    const pages = await db
      .select()
      .from(paperPages)
      .where(eq(paperPages.paperId, paper.id))
      .orderBy(asc(paperPages.pageNumber));

    if (pages.length === 0) {
      return fail("This paper has no stored pages.", 404);
    }

    const zip = new JSZip();

    for (const page of pages) {
      const object = await readObject(paper.id, page.storagePath);

      if (!object) {
        return fail(
          `Page ${page.pageNumber} is no longer available.`,
          404,
        );
      }

      const extension =
        page.fileName.includes(".")
          ? page.fileName.slice(page.fileName.lastIndexOf("."))
          : "";

      zip.file(
        `Page-${String(page.pageNumber).padStart(2, "0")}${extension}`,
        object.data,
      );
    }

    const zipData = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const baseName = paper.fileName.replace(/\.paper$/i, "");

    return new Response(new Uint8Array(zipData), {
      headers: {
        "content-type": "application/zip",
        "content-length": String(zipData.byteLength),
        "content-disposition": `attachment; filename="${baseName}.zip"; filename*=UTF-8''${encodeURIComponent(
          `${baseName}.zip`,
        )}`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  }

  // Existing PDF / single-image download.
  const object = await readObject(paper.id, paper.storagePath);
  if (!object) {
    return fail("The stored file is no longer available.", 404);
  }

  const asciiName = paper.fileName
    .replace(/[^\x20-\x7e]/g, "_")
    .replace(/"/g, "");

  return new Response(new Uint8Array(object.data), {
    headers: {
      "content-type": paper.mimeType,
      "content-length": String(object.data.byteLength),
      "content-disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(
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
