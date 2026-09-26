import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { comments, papers } from "@/db/schema";
import { fail, handleError, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { cleanMultiline } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const rows = await db
      .select({
        id: comments.id,
        body: comments.body,
        authorName: comments.authorName,
        userId: comments.userId,
        createdAt: comments.createdAt,
      })
      .from(comments)
      .where(eq(comments.paperId, id))
      .orderBy(asc(comments.createdAt));
    return ok({
      comments: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return fail("Please sign in to post a comment.", 401);
    }
    const body = (await request.json().catch(() => ({}))) as { body?: unknown };
    const text = cleanMultiline(body.body, 1500);
    if (!text) return fail("Please write something before posting.", 400);

    const paper = await db
      .select({ id: papers.id })
      .from(papers)
      .where(eq(papers.id, id))
      .limit(1);
    if (paper.length === 0) return fail("That paper could not be found.", 404);

    const inserted = await db
      .insert(comments)
      .values({
        paperId: id,
        userId: user.id,
        authorName: user.fullName ?? user.email,
        body: text,
      })
      .returning();

    await db
      .update(papers)
      .set({ commentCount: sql`${papers.commentCount} + 1` })
      .where(eq(papers.id, id));

    const comment = inserted[0];
    return ok(
      {
        comment: comment
          ? { ...comment, createdAt: comment.createdAt.toISOString() }
          : null,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}
