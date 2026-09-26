import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, paperPages, papers } from "@/db/schema";
import { fail, handleError, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { getPaperById } from "@/lib/papers";
import { deleteObject, replaceObject } from "@/lib/storage";
import {
  cleanMetadata,
  sanitizeFileName,
  validateFile,
  getExtension,
  ALLOWED_EXTENSIONS,
  MIME_BY_EXT,
  type AllowedExtension,
} from "@/lib/validation";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function loadAuthorisedPaper(id: string) {
  const paper = await getPaperById(id);
  if (!paper) return { paper: null, allowed: false, user: null };
  const user = await getCurrentUser();
  const allowed = Boolean(user && (user.role === "admin" || user.id === paper.ownerId));
  return { paper, allowed, user };
}

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { paper, allowed, user } = await loadAuthorisedPaper(id);
    if (!paper) return fail("That paper could not be found.", 404);
    const publiclyVisible = paper.status === "APPROVED";
    if (!publiclyVisible && !allowed) {
      return fail("This paper is awaiting approval and is not public yet.", 403);
    }
    let myVote = 0;
    if (user) {
      const { votes } = await import("@/db/schema");
      const rows = await db
        .select({ value: votes.value })
        .from(votes)
        .where(and(eq(votes.paperId, paper.id), eq(votes.userId, user.id)))
        .limit(1);
      myVote = rows[0]?.value ?? 0;
    }
    return ok({ paper, myVote, canManage: allowed });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { paper, allowed, user } = await loadAuthorisedPaper(id);
    if (!paper) return fail("That paper could not be found.", 404);
    if (!allowed) {
      return fail(
        user
          ? "You do not have permission to edit this paper."
          : "Please sign in to edit your papers.",
        403,
      );
    }

    const contentType = request.headers.get("content-type") ?? "";
    let raw: Record<string, unknown> = {};
    let replacement: { buffer: Buffer; name: string } | null = null;
    const settings = await getSettings();

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      for (const key of [
        "fileName",
        "uploaderName",
        "classLevel",
        "board",
        "subject",
        "exam",
        "year",
        "school",
        "paperType",
        "description",
      ]) {
        const value = form.get(key);
        if (value !== null) raw[key] = typeof value === "string" ? value : "";
      }
      const file = form.get("file");
      if (file instanceof File && file.size > 0) {
        replacement = { buffer: Buffer.from(await file.arrayBuffer()), name: file.name };
      }
    } else {
      raw = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    }

    const metadata = cleanMetadata(raw);
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    let newFileName = paper.fileName;
    if (raw.fileName !== undefined) {
      const candidate = sanitizeFileName(String(raw.fileName));
      if (!candidate) return fail("Please provide a valid file name.", 400);
      if (candidate !== paper.fileName) {
        const clash = await db
          .select({ id: papers.id })
          .from(papers)
          .where(
            and(sql`lower(${papers.fileName}) = lower(${candidate})`, ne(papers.id, paper.id)),
          )
          .limit(1);
        if (clash.length > 0) return fail("A file with this name already exists.", 409);
        newFileName = candidate;
        updates.fileName = candidate;
      }
    }

    if (metadata.uploaderName) updates.uploaderName = metadata.uploaderName;
    if (raw.classLevel !== undefined) updates.classLevel = metadata.classLevel;
    if (raw.board !== undefined) updates.board = metadata.board;
    if (raw.subject !== undefined) updates.subject = metadata.subject;
    if (raw.exam !== undefined) updates.exam = metadata.exam;
    if (raw.year !== undefined) updates.year = metadata.year;
    if (raw.school !== undefined) updates.school = metadata.school;
    if (raw.paperType !== undefined) updates.paperType = metadata.paperType;
    if (raw.description !== undefined) updates.description = metadata.description;

    if (replacement && paper.fileExt.toLowerCase() === "images") {
      return fail(
        "Multi-page image papers cannot have their file replaced from the edit screen yet. Edit the paper details instead.",
        400,
      );
    }

    if (replacement) {
      const verdict = validateFile(
        { name: newFileName === paper.fileName ? paper.fileName : newFileName, size: replacement.buffer.byteLength },
        replacement.buffer,
        settings.maxUploadMb,
      );
      const ext = getExtension(verdict.ok ? verdict.name : newFileName);
      if (!verdict.ok) {
        return fail(verdict.error, 415);
      }
      if (!ALLOWED_EXTENSIONS.includes(ext as AllowedExtension)) {
        return fail("This file type is not supported.", 415);
      }
      updates.fileSize = verdict.size;
      updates.fileExt = verdict.ext;
      updates.mimeType = verdict.mime;
      await replaceObject(paper.id, paper.storagePath, replacement.buffer, verdict.mime);
    }

    await db.update(papers).set(updates).where(eq(papers.id, paper.id));

    await db
      .insert(auditLogs)
      .values({
        actorId: user?.id ?? null,
        action: "paper.update",
        targetType: "paper",
        targetId: paper.id,
        details: newFileName,
      })
      .catch(() => undefined);

    const fresh = await getPaperById(paper.id);
    return ok({ paper: fresh, message: "Changes saved." });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { paper, allowed, user } = await loadAuthorisedPaper(id);
    if (!paper) return fail("That paper could not be found.", 404);
    if (!allowed) {
      return fail(
        user
          ? "You do not have permission to delete this paper."
          : "Please sign in to delete your papers.",
        403,
      );
    }
    // Multi-page image papers have one storage object per page.
    // Remove every page object before deleting the catalogue row.
    const pages = await db
      .select({
        storagePath: paperPages.storagePath,
      })
      .from(paperPages)
      .where(eq(paperPages.paperId, paper.id));

    for (const page of pages) {
      await deleteObject(paper.id, page.storagePath);
    }

    // Delete the original/single-file object as well. For multi-page papers
    // this is harmless if the primary path is not separately present.
    if (pages.length === 0) {
      await deleteObject(paper.id, paper.storagePath);
    }

    await db.delete(papers).where(eq(papers.id, paper.id));
    await db
      .insert(auditLogs)
      .values({
        actorId: user?.id ?? null,
        action: "paper.delete",
        targetType: "paper",
        targetId: paper.id,
        details: paper.fileName,
      })
      .catch(() => undefined);
    return ok({ message: "The paper has been permanently removed." });
  } catch (error) {
    return handleError(error);
  }
}

export { MIME_BY_EXT };
