import { and, asc, count, desc, eq, ilike, isNotNull, or, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { papers, profiles } from "@/db/schema";
import type { SortValue } from "@/lib/site";

export const PAGE_SIZE = 100;
export const MAX_PAGE_SIZE = 100;

export type PaperListItem = {
  id: string;
  fileName: string;
  uploaderName: string;
  ownerId: string | null;
  classLevel: string | null;
  board: string | null;
  subject: string | null;
  exam: string | null;
  year: number | null;
  school: string | null;
  paperType: string | null;
  fileSize: number;
  fileExt: string;
  mimeType: string;
  status: string;
  downloadCount: number;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  createdAt: string;
};

export type ListPapersParams = {
  q?: string;
  classLevel?: string;
  board?: string;
  subject?: string;
  exam?: string;
  year?: string;
  paperType?: string;
  school?: string;
  fileExt?: string;
  sort?: SortValue | string;
  page?: number;
  pageSize?: number;
  /** Restrict to one owner (My Uploads). */
  ownerId?: string;
  /** "public" = approved only (default), "pending", "all" (admin only). */
  statusView?: "public" | "pending" | "all";
};

export type ListPapersResult = {
  items: PaperListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function buildWhere(params: ListPapersParams): SQL | undefined {
  const clauses: (SQL | undefined)[] = [];

  const statusView = params.statusView ?? "public";
  if (statusView === "public") clauses.push(eq(papers.status, "APPROVED"));
  else if (statusView === "pending") clauses.push(eq(papers.status, "PENDING"));

  if (params.ownerId) clauses.push(eq(papers.ownerId, params.ownerId));

  const q = params.q?.trim();
  if (q) {
    const like = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;
    clauses.push(
      or(
        ilike(papers.fileName, like),
        ilike(papers.subject, like),
        ilike(papers.uploaderName, like),
        ilike(papers.exam, like),
        ilike(papers.school, like),
        ilike(papers.board, like),
        ilike(papers.classLevel, like),
        ilike(papers.paperType, like),
        ilike(papers.description, like),
      ),
    );
  }

  if (params.classLevel) clauses.push(eq(papers.classLevel, params.classLevel));
  if (params.board) clauses.push(eq(papers.board, params.board));
  if (params.subject) clauses.push(eq(papers.subject, params.subject));
  if (params.exam) clauses.push(eq(papers.exam, params.exam));
  if (params.paperType) clauses.push(eq(papers.paperType, params.paperType));
  if (params.school) clauses.push(eq(papers.school, params.school));
  if (params.fileExt) {
    const ext = params.fileExt.toLowerCase().replace(/^\./, "");
    clauses.push(eq(papers.fileExt, ext === "jpg" ? "jpg" : ext));
  }

  const yearValue = Number.parseInt(params.year ?? "", 10);
  if (Number.isFinite(yearValue)) clauses.push(eq(papers.year, yearValue));

  const filtered = clauses.filter(Boolean) as SQL[];
  if (filtered.length === 0) return undefined;
  return and(...filtered);
}

function orderFor(sort: string | undefined) {
  switch (sort) {
    case "oldest":
      return [asc(papers.createdAt)];
    case "name-asc":
      return [asc(papers.fileName)];
    case "name-desc":
      return [desc(papers.fileName)];
    case "downloads":
      return [desc(papers.downloadCount), desc(papers.createdAt)];
    case "likes":
      return [desc(papers.likeCount), desc(papers.createdAt)];
    default:
      return [desc(papers.createdAt)];
  }
}

export async function listPapers(params: ListPapersParams): Promise<ListPapersResult> {
  const pageSize = Math.min(Math.max(params.pageSize ?? PAGE_SIZE, 1), MAX_PAGE_SIZE);
  const where = buildWhere(params);
  const totalRows = await db
    .select({ n: count() })
    .from(papers)
    .where(where);
  const total = Number(totalRows[0]?.n ?? 0);
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const page = Math.min(Math.max(params.page ?? 1, 1), totalPages);

  const rows = await db
    .select({
      id: papers.id,
      fileName: papers.fileName,
      uploaderName: papers.uploaderName,
      ownerId: papers.ownerId,
      classLevel: papers.classLevel,
      board: papers.board,
      subject: papers.subject,
      exam: papers.exam,
      year: papers.year,
      school: papers.school,
      paperType: papers.paperType,
      fileSize: papers.fileSize,
      fileExt: papers.fileExt,
      mimeType: papers.mimeType,
      status: papers.status,
      downloadCount: papers.downloadCount,
      likeCount: papers.likeCount,
      dislikeCount: papers.dislikeCount,
      commentCount: papers.commentCount,
      createdAt: papers.createdAt,
    })
    .from(papers)
    .where(where)
    .orderBy(...orderFor(params.sort as string | undefined))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    items: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getPaperById(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const rows = await db
    .select({
      paper: papers,
      ownerEmail: profiles.email,
      ownerName: profiles.fullName,
    })
    .from(papers)
    .leftJoin(profiles, eq(profiles.id, papers.ownerId))
    .where(eq(papers.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    ...row.paper,
    createdAt: row.paper.createdAt.toISOString(),
    updatedAt: row.paper.updatedAt.toISOString(),
    ownerEmail: row.ownerEmail,
    ownerDisplayName: row.ownerName ?? row.paper.uploaderName,
  };
}

export type FacetValue = { value: string; count: number };

export async function getFacets(): Promise<Record<string, FacetValue[]>> {
  const run = async (column: AnyPgColumn) => {
    const rows = await db
      .select({ value: column, n: count() })
      .from(papers)
      .where(and(eq(papers.status, "APPROVED"), isNotNull(column)))
      .groupBy(column)
      .orderBy(asc(column));
    return (rows as { value: string | null; n: number }[])
      .filter((r) => Boolean(r.value))
      .map((r) => ({ value: r.value as string, count: Number(r.n) }));
  };
  const [classLevels, boards, subjects, exams, schools, paperTypes, years] = await Promise.all([
    run(papers.classLevel),
    run(papers.board),
    run(papers.subject),
    run(papers.exam),
    run(papers.school),
    run(papers.paperType),
    db
      .select({ value: papers.year, n: count() })
      .from(papers)
      .where(and(eq(papers.status, "APPROVED"), isNotNull(papers.year)))
      .groupBy(papers.year)
      .orderBy(desc(papers.year)),
  ]);
  return {
    classLevel: classLevels,
    board: boards,
    subject: subjects,
    exam: exams,
    school: schools,
    paperType: paperTypes,
    year: years
      .filter((r): r is { value: number; n: number } => r.value !== null)
      .map((r) => ({ value: String(r.value), count: Number(r.n) })),
  };
}

export type PublicStats = {
  totalUploads: number;
  approvedPapers: number;
  pendingPapers: number;
  totalDownloads: number;
  totalLikes: number;
  totalDislikes: number;
  totalComments: number;
  totalUsers: number;
  totalContributors: number;
};

export async function getPublicStats(): Promise<PublicStats> {
  const result = await db.execute(sql`
    select
      (select count(*) from papers) as total_uploads,
      (select count(*) from papers where status = 'APPROVED') as approved_papers,
      (select count(*) from papers where status = 'PENDING') as pending_papers,
      (select coalesce(sum(download_count), 0) from papers) as total_downloads,
      (select coalesce(sum(like_count), 0) from papers) as total_likes,
      (select coalesce(sum(dislike_count), 0) from papers) as total_dislikes,
      (select count(*) from comments) as total_comments,
      (select count(*) from profiles) as total_users,
      (select count(distinct owner_id) from papers where owner_id is not null) as contributors
  `);
  const row = (result.rows[0] ?? {}) as Record<string, unknown>;
  const num = (v: unknown) => Number(v ?? 0);
  return {
    totalUploads: num(row.total_uploads),
    approvedPapers: num(row.approved_papers),
    pendingPapers: num(row.pending_papers),
    totalDownloads: num(row.total_downloads),
    totalLikes: num(row.total_likes),
    totalDislikes: num(row.total_dislikes),
    totalComments: num(row.total_comments),
    totalUsers: num(row.total_users),
    totalContributors: num(row.contributors),
  };
}
