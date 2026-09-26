import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs,
  comments,
  papers,
  profiles,
  reports,
  teachers,
} from "@/db/schema";
import { fail, handleError, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getPaperById, listPapers } from "@/lib/papers";
import { getSettings, setAutoApproval, setMaxUploadMb } from "@/lib/settings";
import { deleteObject } from "@/lib/storage";
import { cleanText } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const view = new URL(request.url).searchParams.get("view") ?? "overview";

    if (view === "overview") {
      const settings = await getSettings();
      const statsRow = await db.execute(sql`
        select
          (select count(*) from papers) as total_uploads,
          (select count(*) from papers where status = 'APPROVED') as approved_papers,
          (select count(*) from papers where status = 'PENDING') as pending_papers,
          (select coalesce(sum(download_count),0) from papers) as total_downloads,
          (select coalesce(sum(like_count),0) from papers) as total_likes,
          (select coalesce(sum(dislike_count),0) from papers) as total_dislikes,
          (select count(*) from comments) as total_comments,
          (select count(*) from reports where status = 'OPEN') as open_reports,
          (select count(*) from profiles) as total_users,
          (select count(distinct owner_id) from papers where owner_id is not null) as contributors
      `);
      const row = (statsRow.rows[0] ?? {}) as Record<string, unknown>;
      const num = (v: unknown) => Number(v ?? 0);
      const storageRow = await db.execute(sql`
        select coalesce(sum(file_size),0) as bytes, count(*) as objects from papers
      `);
      const storage = (storageRow.rows[0] ?? {}) as Record<string, unknown>;
      const recent = await db
        .select({
          id: papers.id,
          fileName: papers.fileName,
          uploaderName: papers.uploaderName,
          status: papers.status,
          createdAt: papers.createdAt,
        })
        .from(papers)
        .orderBy(desc(papers.createdAt))
        .limit(8);
      return ok({
        settings,
        stats: {
          totalUploads: num(row.total_uploads),
          approvedPapers: num(row.approved_papers),
          pendingPapers: num(row.pending_papers),
          totalDownloads: num(row.total_downloads),
          totalLikes: num(row.total_likes),
          totalDislikes: num(row.total_dislikes),
          totalComments: num(row.total_comments),
          openReports: num(row.open_reports),
          totalUsers: num(row.total_users),
          totalContributors: num(row.contributors),
          storageBytes: num(storage.bytes),
          storedObjects: num(storage.objects),
        },
        recent: recent.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      });
    }

    if (view === "pending") {
      const result = await listPapers({ statusView: "pending", pageSize: 100, sort: "oldest" });
      return ok(result);
    }

    if (view === "papers") {
      const url = new URL(request.url);
      const result = await listPapers({
        statusView: "all",
        q: url.searchParams.get("q") ?? undefined,
        sort: url.searchParams.get("sort") ?? "newest",
        page: Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1,
        pageSize: 100,
      });
      return ok(result);
    }

    if (view === "reports") {
      const rows = await db
        .select({
          report: reports,
          paperName: papers.fileName,
          paperStatus: papers.status,
        })
        .from(reports)
        .leftJoin(papers, eq(papers.id, reports.paperId))
        .orderBy(desc(reports.createdAt))
        .limit(200);
      return ok({
        reports: rows.map((r) => ({
          ...r.report,
          createdAt: r.report.createdAt.toISOString(),
          paperName: r.paperName,
          paperStatus: r.paperStatus,
        })),
      });
    }

    if (view === "comments") {
      const rows = await db
        .select({
          comment: comments,
          paperName: papers.fileName,
        })
        .from(comments)
        .leftJoin(papers, eq(papers.id, comments.paperId))
        .orderBy(desc(comments.createdAt))
        .limit(200);
      return ok({
        comments: rows.map((r) => ({
          ...r.comment,
          createdAt: r.comment.createdAt.toISOString(),
          paperName: r.paperName,
        })),
      });
    }

    if (view === "users") {
      const rows = await db
        .select({
          id: profiles.id,
          email: profiles.email,
          fullName: profiles.fullName,
          school: profiles.school,
          role: profiles.role,
          createdAt: profiles.createdAt,
          uploads: sql<number>`(select count(*) from papers p where p.owner_id = ${profiles.id})`,
        })
        .from(profiles)
        .orderBy(desc(profiles.createdAt))
        .limit(200);
      return ok({
        users: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      });
    }

    if (view === "teachers") {
      const rows = await db.select().from(teachers).orderBy(desc(teachers.createdAt));
      return ok({ teachers: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })) });
    }

    if (view === "audit") {
      const rows = await db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(100);
      return ok({ logs: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })) });
    }

    return fail("Unknown view.", 400);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = String(body.action ?? "");

    const log = (targetType: string, targetId: string | null, details: string) =>
      db
        .insert(auditLogs)
        .values({
          actorId: admin.id,
          action,
          targetType,
          targetId,
          details,
        })
        .catch(() => undefined);

    switch (action) {
      case "approve": {
        const id = String(body.paperId ?? "");
        await db.update(papers).set({ status: "APPROVED", updatedAt: new Date() }).where(eq(papers.id, id));
        await log("paper", id, "approved");
        return ok({ message: "Paper approved and published." });
      }
      case "approve-all": {
        const result = await db
          .update(papers)
          .set({ status: "APPROVED", updatedAt: new Date() })
          .where(eq(papers.status, "PENDING"))
          .returning({ id: papers.id });
        await log("papers", null, `approved ${result.length} papers`);
        return ok({ message: `${result.length} paper(s) approved.` });
      }
      case "unpublish": {
        const id = String(body.paperId ?? "");
        await db.update(papers).set({ status: "PENDING", updatedAt: new Date() }).where(eq(papers.id, id));
        await log("paper", id, "moved back to pending");
        return ok({ message: "Paper moved back to pending." });
      }
      case "delete-paper": {
        const id = String(body.paperId ?? "");
        const paper = await getPaperById(id);
        if (!paper) return fail("That paper could not be found.", 404);
        await deleteObject(paper.id, paper.storagePath);
        await db.delete(papers).where(eq(papers.id, id));
        await log("paper", id, `deleted ${paper.fileName}`);
        return ok({ message: "The paper has been permanently removed." });
      }
      case "set-auto-approval": {
        const enabled = Boolean(body.enabled);
        await setAutoApproval(enabled);
        await log("settings", null, `auto approval = ${enabled}`);
        return ok({ message: `Auto approval is now ${enabled ? "ON" : "OFF"}.` });
      }
      case "set-max-upload": {
        const mb = Number(body.maxUploadMb);
        if (!Number.isFinite(mb) || mb < 1 || mb > 200) {
          return fail("Choose a maximum size between 1 and 200 MB.", 400);
        }
        await setMaxUploadMb(Math.round(mb));
        await log("settings", null, `max upload = ${mb} MB`);
        return ok({ message: `Maximum upload size set to ${Math.round(mb)} MB.` });
      }
      case "resolve-report": {
        const id = String(body.reportId ?? "");
        await db.update(reports).set({ status: "RESOLVED" }).where(eq(reports.id, id));
        await db.execute(sql`
          update papers p set open_report_count =
            (select count(*) from reports r where r.paper_id = p.id and r.status = 'OPEN')
        `);
        await log("report", id, "resolved");
        return ok({ message: "Report marked as resolved." });
      }
      case "delete-comment": {
        const id = String(body.commentId ?? "");
        const found = await db
          .select({ paperId: comments.paperId })
          .from(comments)
          .where(eq(comments.id, id))
          .limit(1);
        await db.delete(comments).where(eq(comments.id, id));
        if (found[0]) {
          await db.execute(sql`
            update papers p set comment_count =
              (select count(*) from comments c where c.paper_id = p.id)
            where p.id = ${found[0].paperId}
          `);
        }
        await log("comment", id, "deleted");
        return ok({ message: "Comment removed." });
      }
      case "set-role": {
        const userId = String(body.userId ?? "");
        const role = cleanText(body.role, 10) === "admin" ? "admin" : "user";
        if (userId === admin.id && role !== "admin") {
          return fail("You cannot remove your own administrator access.", 400);
        }
        await db.update(profiles).set({ role, updatedAt: new Date() }).where(eq(profiles.id, userId));
        await log("profile", userId, `role = ${role}`);
        return ok({ message: `Role updated to ${role}.` });
      }
      default:
        return fail("Unknown action.", 400);
    }
  } catch (error) {
    return handleError(error);
  }
}
