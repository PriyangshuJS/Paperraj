import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, papers } from "@/db/schema";
import { fail, handleError, ok, str } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { listPapers } from "@/lib/papers";
import { getSettings } from "@/lib/settings";
import { putObject, STORAGE_BUCKET } from "@/lib/storage";
import { cleanMetadata, sanitizeFileName, validateFile } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const user = await getCurrentUser();
    const mine = url.searchParams.get("mine") === "1";
    const result = await listPapers({
      q: url.searchParams.get("q") ?? undefined,
      classLevel: url.searchParams.get("class") ?? undefined,
      board: url.searchParams.get("board") ?? undefined,
      subject: url.searchParams.get("subject") ?? undefined,
      exam: url.searchParams.get("exam") ?? undefined,
      year: url.searchParams.get("year") ?? undefined,
      paperType: url.searchParams.get("type") ?? undefined,
      school: url.searchParams.get("school") ?? undefined,
      fileExt: url.searchParams.get("fileType") ?? undefined,
      sort: url.searchParams.get("sort") ?? "newest",
      page: Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1,
      pageSize: Number.parseInt(url.searchParams.get("pageSize") ?? "100", 10) || 100,
      // My Uploads shows every status, but only for the signed-in owner.
      ownerId: mine ? (user?.id ?? "00000000-0000-0000-0000-000000000000") : undefined,
      statusView: mine ? "all" : "public",
    });
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  let paperId: string | null = null;
  let storagePath: string | null = null;
  try {
    const user = await getCurrentUser();
    const settings = await getSettings();

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return fail("The upload could not be read. Please try again.", 400);
    }

    const file = form.get("file");
    if (!(file instanceof File)) return fail("Please choose a file to upload.", 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const verdict = validateFile(file, buffer, settings.maxUploadMb);
    if (!verdict.ok) return fail(verdict.error, 415);

    const fileName = verdict.name;

    // Duplicate filename protection — enforced in the application layer *and* by
    // a unique index in the database.
    const clash = await db
      .select({ id: papers.id })
      .from(papers)
      .where(sql`lower(${papers.fileName}) = lower(${fileName})`)
      .limit(1);
    if (clash.length > 0) {
      return fail("A file with this name already exists.", 409);
    }

    const metadata = cleanMetadata({
      uploaderName: str(form.get("uploaderName")),
      classLevel: str(form.get("classLevel")),
      board: str(form.get("board")),
      subject: str(form.get("subject")),
      exam: str(form.get("exam")),
      year: str(form.get("year")),
      school: str(form.get("school")),
      paperType: str(form.get("paperType")),
      description: str(form.get("description")),
    });

    if (user) {
      if (!metadata.uploaderName) metadata.uploaderName = user.fullName ?? user.email;
      if (!metadata.school && user.school) metadata.school = user.school;
    } else if (!metadata.uploaderName) {
      return fail("Please tell us your name so the upload can be credited.", 400);
    }

    paperId = randomUUID();
    storagePath = `papers/${paperId}/${fileName.replace(/"/g, "")}`;

    const inserted = await db
      .insert(papers)
      .values({
        id: paperId,
        fileName,
        ownerId: user?.id ?? null,
        uploaderName: metadata.uploaderName,
        classLevel: metadata.classLevel,
        board: metadata.board,
        subject: metadata.subject,
        exam: metadata.exam,
        year: metadata.year,
        school: metadata.school,
        paperType: metadata.paperType,
        description: metadata.description,
        fileSize: verdict.size,
        fileExt: verdict.ext,
        mimeType: verdict.mime,
        storageBucket: STORAGE_BUCKET,
        storagePath,
        // Uploads made by the administrator are trusted immediately.
        status:
          settings.autoApproval || user?.role === "admin" ? "APPROVED" : "PENDING",
      })
      .returning();

    const paper = inserted[0];
    if (!paper) throw new Error("Insert returned no row.");

    await putObject(paperId, storagePath, buffer, verdict.mime);

    await db
      .insert(auditLogs)
      .values({
        actorId: user?.id ?? null,
        action: "paper.upload",
        targetType: "paper",
        targetId: paperId,
        details: fileName,
      })
      .catch(() => undefined);

    return ok(
      {
        paper: { ...paper, createdAt: paper.createdAt.toISOString(), updatedAt: paper.updatedAt.toISOString() },
        message:
          paper.status === "APPROVED"
            ? "Thank you! Your paper is now in the library."
            : "Thank you! Your paper was received and is waiting for approval.",
      },
      { status: 201 },
    );
  } catch (error) {
    // Roll back the metadata row if storage failed.
    if (paperId) {
      await db
        .delete(papers)
        .where(sql`${papers.id} = ${paperId}`)
        .catch(() => undefined);
    }
    return handleError(error);
  }
}
