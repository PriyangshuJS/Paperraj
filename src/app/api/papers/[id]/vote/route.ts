import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { papers, votes } from "@/db/schema";
import { handleError, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function recount(paperId: string) {
  await db.execute(sql`
    update papers p set
      like_count = (select count(*) from votes v where v.paper_id = p.id and v.value = 1),
      dislike_count = (select count(*) from votes v where v.paper_id = p.id and v.value = -1)
    where p.id = ${paperId}
  `);
  const rows = await db
    .select({ likeCount: papers.likeCount, dislikeCount: papers.dislikeCount })
    .from(papers)
    .where(eq(papers.id, paperId))
    .limit(1);
  return rows[0] ?? { likeCount: 0, dislikeCount: 0 };
}

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    let myVote = 0;
    if (user) {
      const rows = await db
        .select({ value: votes.value })
        .from(votes)
        .where(and(eq(votes.paperId, id), eq(votes.userId, user.id)))
        .limit(1);
      myVote = rows[0]?.value ?? 0;
    }
    const rows = await db
      .select({ likeCount: papers.likeCount, dislikeCount: papers.dislikeCount })
      .from(papers)
      .where(eq(papers.id, id))
      .limit(1);
    return ok({ ...rows[0], myVote });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return ok(
        { error: "Please sign in to vote — it keeps the archive honest.", needsAuth: true },
        { status: 401 },
      );
    }
    const body = (await request.json().catch(() => ({}))) as { value?: unknown };
    const requested = Number(body.value);
    if (![1, -1, 0].includes(requested)) {
      return ok({ error: "That vote is not valid." }, { status: 400 });
    }

    if (requested === 0) {
      await db
        .delete(votes)
        .where(and(eq(votes.paperId, id), eq(votes.userId, user.id)));
    } else {
      await db
        .insert(votes)
        .values({ paperId: id, userId: user.id, value: requested })
        .onConflictDoUpdate({
          target: [votes.paperId, votes.userId],
          set: { value: requested },
        });
    }
    const counts = await recount(id);
    return ok({ ...counts, myVote: requested });
  } catch (error) {
    return handleError(error);
  }
}
