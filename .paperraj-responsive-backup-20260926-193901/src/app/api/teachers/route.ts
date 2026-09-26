import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { teachers } from "@/db/schema";
import { fail, handleError, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { cleanMultiline, cleanText } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(teachers)
      .orderBy(asc(teachers.name));
    return ok({
      teachers: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return fail("Administrator access required.", 403);
    }
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const name = cleanText(body.name, 120);
    if (!name) return fail("Please provide the teacher's name.", 400);
    const inserted = await db
      .insert(teachers)
      .values({
        name,
        subject: cleanText(body.subject, 100),
        school: cleanText(body.school, 160),
        contact: cleanText(body.contact, 160),
        notes: cleanMultiline(body.notes, 1000),
      })
      .returning();
    const teacher = inserted[0];
    return ok(
      { teacher: teacher ? { ...teacher, createdAt: teacher.createdAt.toISOString() } : null },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return fail("Administrator access required.", 403);
    }
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return fail("Missing teacher id.", 400);
    await db.delete(teachers).where(eq(teachers.id, id));
    return ok({ message: "Removed." });
  } catch (error) {
    return handleError(error);
  }
}
