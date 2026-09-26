import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { papers, reports } from "@/db/schema";
import { fail, handleError, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { REPORT_REASONS } from "@/lib/site";
import { cleanMultiline, cleanText } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const reason = cleanText(body.reason, 60);
    if (!reason) return fail("Please choose a reason for the report.", 400);
    const known = REPORT_REASONS.find((r) => r.toLowerCase() === reason.toLowerCase());
    const details = cleanMultiline(body.details, 1000);

    const paper = await db
      .select({ id: papers.id })
      .from(papers)
      .where(eq(papers.id, id))
      .limit(1);
    if (paper.length === 0) return fail("That paper could not be found.", 404);

    await db.insert(reports).values({
      paperId: id,
      reporterId: user?.id ?? null,
      reporterName: user?.fullName ?? cleanText(body.reporterName, 120) ?? "Anonymous reader",
      reason: known ?? reason,
      details,
    });

    await db
      .update(papers)
      .set({ openReportCount: sql`${papers.openReportCount} + 1` })
      .where(eq(papers.id, id));

    return ok({ message: "Thank you — a librarian will review this shortly." }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
