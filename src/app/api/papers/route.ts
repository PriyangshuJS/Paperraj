import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, paperPages, papers } from "@/db/schema";
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
  const uploadedStoragePaths: string[] = [];

  try {
    const user = await getCurrentUser();
    const settings = await getSettings();

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return fail("The upload could not be read. Please try again.", 400);
    }

    const uploadedFiles = form.getAll("files");
    const legacyFile = form.get("file");

    const files = uploadedFiles.length > 0
      ? uploadedFiles.filter((value): value is File => value instanceof File)
      : legacyFile instanceof File
        ? [legacyFile]
        : [];

    if (files.length === 0) {
      return fail("Please choose a file to upload.", 400);
    }

    if (files.length > 10) {
      return fail("You can upload a maximum of 10 files at a time.", 400);
    }

    const hasPdf = files.some(
      (file) => file.name.split(".").pop()?.toLowerCase() === "pdf",
    );

    if (hasPdf && files.length > 1) {
      return fail(
        "A PDF must be uploaded by itself. For multiple pages, upload images.",
        400,
      );
    }

    const validatedFiles: Array<{
      file: File;
      buffer: Buffer;
      name: string;
      size: number;
      ext: string;
      mime: string;
    }> = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const verdict = validateFile(file, buffer, settings.maxUploadMb);

      if (!verdict.ok) {
        return fail(`${file.name}: ${verdict.error}`, 415);
      }

      validatedFiles.push({
        file,
        buffer,
        name: verdict.name,
        size: verdict.size,
        ext: verdict.ext,
        mime: verdict.mime,
      });
    }

    const totalSize = validatedFiles.reduce((sum, item) => sum + item.size, 0);

    /*
     * The main papers row represents the whole submission.
     * For image submissions, individual pages are stored in paper_pages.
     * For PDFs, the existing single-file storage path is retained.
     */
    const primary = validatedFiles[0];
    if (!primary) throw new Error("No validated files.");

    const fileName =
      validatedFiles.length === 1
        ? primary.name
        : `${primary.name.replace(/\.[^.]+$/, "")}-pages-${validatedFiles.length}`;

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

    const isMultiPage = validatedFiles.length > 1;

    const storagePath = isMultiPage
      ? `papers/${paperId}/pages/1/${primary.name.replace(/"/g, "")}`
      : `papers/${paperId}/${primary.name.replace(/"/g, "")}`;

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
        fileSize: totalSize,
        fileExt: isMultiPage ? "images" : primary.ext,
        mimeType: isMultiPage ? "application/x-paperraj-pages" : primary.mime,
        storageBucket: STORAGE_BUCKET,
        storagePath,
        status:
          settings.autoApproval || user?.role === "admin" ? "APPROVED" : "PENDING",
      })
      .returning();

    const paper = inserted[0];
    if (!paper) throw new Error("Insert returned no row.");

    if (isMultiPage) {
      for (let index = 0; index < validatedFiles.length; index++) {
        const page = validatedFiles[index];
        if (!page) continue;

        const pageNumber = index + 1;
        const pagePath =
          `papers/${paperId}/pages/${pageNumber}/${page.name.replace(/"/g, "")}`;

        await putObject(paperId, pagePath, page.buffer, page.mime);
        uploadedStoragePaths.push(pagePath);

        await db.insert(paperPages).values({
          paperId,
          pageNumber,
          fileName: page.name,
          fileSize: page.size,
          mimeType: page.mime,
          storageBucket: STORAGE_BUCKET,
          storagePath: pagePath,
        });
      }
    } else {
      await putObject(paperId, storagePath, primary.buffer, primary.mime);
      uploadedStoragePaths.push(storagePath);
    }

    await db
      .insert(auditLogs)
      .values({
        actorId: user?.id ?? null,
        action: "paper.upload",
        targetType: "paper",
        targetId: paperId,
        details:
          validatedFiles.length > 1
            ? `${validatedFiles.length} pages: ${validatedFiles.map((file) => file.name).join(", ")}`
            : primary.name,
      })
      .catch(() => undefined);

    return ok(
      {
        paper: {
          ...paper,
          createdAt: paper.createdAt.toISOString(),
          updatedAt: paper.updatedAt.toISOString(),
        },
        message:
          paper.status === "APPROVED"
            ? "Thank you! Your paper is now in the library."
            : "Thank you! Your paper was received and is waiting for approval.",
      },
      { status: 201 },
    );
  } catch (error) {
    if (paperId) {
      for (const path of uploadedStoragePaths) {
        await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ""}/storage/v1/object/${STORAGE_BUCKET}/${path}`,
          {
            method: "DELETE",
            headers: {
              apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
            },
          },
        ).catch(() => undefined);
      }

      await db
        .delete(paperPages)
        .where(sql`${paperPages.paperId} = ${paperId}`)
        .catch(() => undefined);

      await db
        .delete(papers)
        .where(sql`${papers.id} = ${paperId}`)
        .catch(() => undefined);
    }

    return handleError(error);
  }
}

