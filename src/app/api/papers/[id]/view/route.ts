import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { paperPages } from "@/db/schema";
import { fail, handleError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { getPaperById } from "@/lib/papers";
import { readObject } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const paper = await getPaperById(id);

    if (!paper) return fail("That paper could not be found.", 404);

    const user = await getCurrentUser();
    const isPrivileged = Boolean(
      user && (user.role === "admin" || user.id === paper.ownerId),
    );

    if (paper.status !== "APPROVED" && !isPrivileged) {
      return fail("This paper is awaiting approval and is not public yet.", 403);
    }

    const url = new URL(request.url);

    // Multi-image paper metadata.
    if (paper.fileExt.toLowerCase() === "images") {
      const pages = await db
        .select({
          pageNumber: paperPages.pageNumber,
        })
        .from(paperPages)
        .where(eq(paperPages.paperId, paper.id))
        .orderBy(asc(paperPages.pageNumber));

      if (url.searchParams.get("info") === "1") {
        return Response.json({
          totalPages: pages.length,
          pages: pages.map((page) => page.pageNumber),
        });
      }

      const requestedPage = Number.parseInt(
        url.searchParams.get("page") ?? "1",
        10,
      );

      if (
        !Number.isInteger(requestedPage) ||
        requestedPage < 1 ||
        requestedPage > pages.length
      ) {
        return fail("That page does not exist.", 404);
      }

      const page = pages.find((item) => item.pageNumber === requestedPage);
      if (!page) return fail("That page does not exist.", 404);

      const pageRow = await db
        .select()
        .from(paperPages)
        .where(
          and(
            eq(paperPages.paperId, paper.id),
            eq(paperPages.pageNumber, requestedPage),
          ),
        )
        .limit(1);

      const storedPage = pageRow[0];
      if (!storedPage) return fail("That page does not exist.", 404);

      const object = await readObject(paper.id, storedPage.storagePath);
      if (!object) {
        return fail("The stored page is no longer available.", 404);
      }

      return new Response(new Uint8Array(object.data), {
        headers: {
          "content-type": storedPage.mimeType,
          "content-length": String(object.data.byteLength),
          "content-disposition": "inline",
          "cache-control": "private, no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }

    // Existing PDF/single-image behaviour.
    const object = await readObject(paper.id, paper.storagePath);

    if (!object) {
      return fail("The stored file is no longer available.", 404);
    }

    return new Response(new Uint8Array(object.data), {
      headers: {
        "content-type": paper.mimeType,
        "content-length": String(object.data.byteLength),
        "content-disposition": "inline",
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
